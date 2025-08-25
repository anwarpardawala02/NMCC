import { useState, useEffect } from "react";
import { 
  Box, 
  Heading, 
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  VStack
} from "@chakra-ui/react";
import { RequireAdmin } from "../routes/RequireAdmin";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionsTable } from "../components/TransactionsTable";
import { SummaryCards } from "../components/SummaryCards";
// import { AdminBlogForm } from "../components/AdminBlogForm";
import { AdminSponsorForm } from "../components/AdminSponsorForm";
import { AdminStatsForm } from "../components/AdminStatsForm";
// Removed legacy AdminFeesForm; using Fees Matrix over club_fees
import AdminFeesMatrix from "../components/AdminFeesMatrix";
import { AdminExpensesForm } from "../components/AdminExpensesForm";
import { listTransactions, listClubFees } from "../lib/db";

function AdminDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clubFees, setClubFees] = useState<any[]>([]);
  const [optimisticKPI, setOptimisticKPI] = useState<{revenue: number, expense: number, net: number} | null>(null);

  const [filters, setFilters] = useState<{ month: string; kind: string }>({
    month: new Date().toISOString().slice(0, 7),
    kind: ''
  });


  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    try {
      const [txs, fees] = await Promise.all([
        listTransactions(filters),
        listClubFees()
      ]);
      setTransactions(txs);
      setClubFees(fees);
      setOptimisticKPI(null); // Reset optimistic KPI after real data loads
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // Sum revenue from transactions and paid club fees
  const summaryData = optimisticKPI ?? (() => {
    let revenue = 0, expense = 0;
    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.kind === 'revenue') revenue += amount;
      else expense += amount;
    }
    // Add paid club fees (paid_on not null)
    for (const fee of clubFees) {
      if (fee.paid_on) revenue += Number(fee.amount);
    }
    return { revenue, expense, net: revenue - expense };
  })();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="xl" color="green.600">
            Club Administration
          </Heading>
        </Box>

        <Tabs colorScheme="green">
          <TabList>
            <Tab>Transactions</Tab>
            <Tab>Fees</Tab>
            <Tab>Expenses</Tab>
            <Tab>Sponsors</Tab>
            <Tab>Statistics</Tab>
          </TabList>

          <TabPanels>
            {/* Transactions Tab */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <SummaryCards data={summaryData} />
                
                <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
                  <Heading size="md" mb={4}>Add Transaction</Heading>
                  <TransactionForm onSuccess={() => {
                    loadData();
                  }} />
                </Box>

                <Box>
                  <Heading size="md" mb={4}>Recent Transactions</Heading>
                  <TransactionsTable 
                    transactions={transactions}
                    onFilterChange={(f: { month?: string; kind?: string }) => 
                      setFilters(prev => ({ ...prev, ...f }))
                    }
                    filters={filters}
                  />
                </Box>
              </VStack>
            </TabPanel>

            {/* Fees Tab */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <AdminFeesMatrix />
              </VStack>
            </TabPanel>

            {/* Expenses Tab */}
            <TabPanel>
              <AdminExpensesForm />
            </TabPanel>



            {/* Sponsors Tab */}
            <TabPanel>
              <AdminSponsorForm />
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel>
              <AdminStatsForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

// Export a wrapped version of the component that requires admin privileges
export default function Admin() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
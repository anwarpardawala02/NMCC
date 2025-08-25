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
import { AdminMatchForm } from "../components/AdminMatchForm";
import { AdminBlogForm } from "../components/AdminBlogForm";
import { AdminSponsorForm } from "../components/AdminSponsorForm";
import { AdminPollForm } from "../components/AdminPollForm";
import { AdminStatsForm } from "../components/AdminStatsForm";
import { AdminFixtureForm } from "../components/AdminFixtureForm";
import { AdminFeesForm } from "../components/AdminFeesForm";
import { AdminExpensesForm } from "../components/AdminExpensesForm";
import { listTransactions } from "../lib/db";

function AdminDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ month: string; kind: string }>({
    month: new Date().toISOString().slice(0, 7),
    kind: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  async function loadTransactions() {
    try {
      const data = await listTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  const summaryData = transactions.reduce((acc: any, tx: any) => {
    const amount = Number(tx.amount);
    if (tx.kind === 'revenue') {
      acc.revenue += amount;
    } else {
      acc.expense += amount;
    }
    acc.net = acc.revenue - acc.expense;
    return acc;
  }, { revenue: 0, expense: 0, net: 0 });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl" color="green.600">
          Club Administration
        </Heading>

        <Tabs colorScheme="green">
          <TabList>
            <Tab>Transactions</Tab>
            <Tab>Fixtures</Tab>
            <Tab>Fees</Tab>
            <Tab>Expenses</Tab>
            <Tab>Matches</Tab>
            <Tab>Blog</Tab>
            <Tab>Sponsors</Tab>
            <Tab>Polls</Tab>
            <Tab>Statistics</Tab>
          </TabList>

          <TabPanels>
            {/* Transactions Tab */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <SummaryCards data={summaryData} />
                
                <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
                  <Heading size="md" mb={4}>Add Transaction</Heading>
                  <TransactionForm onSuccess={loadTransactions} />
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

            {/* Fixtures Tab */}
            <TabPanel>
              <AdminFixtureForm />
            </TabPanel>

            {/* Fees Tab */}
            <TabPanel>
              <AdminFeesForm />
            </TabPanel>

            {/* Expenses Tab */}
            <TabPanel>
              <AdminExpensesForm />
            </TabPanel>

            {/* Matches Tab */}
            <TabPanel>
              <AdminMatchForm />
            </TabPanel>

            {/* Blog Tab */}
            <TabPanel>
              <AdminBlogForm />
            </TabPanel>

            {/* Sponsors Tab */}
            <TabPanel>
              <AdminSponsorForm />
            </TabPanel>

            {/* Polls Tab */}
            <TabPanel>
              <AdminPollForm />
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
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Box, Tabs, TabList, Tab, Container } from "@chakra-ui/react";

const teamTabs = [
  { label: "Squad", path: "/team/squad" },
  { label: "Matches", path: "/team/matches" },
  { label: "Statistics", path: "/team/statistics" },
];

export default function TeamLayout() {
  const location = useLocation();
  // Find the active tab index based on the current path
  const activeIndex = teamTabs.findIndex(tab => location.pathname.startsWith(tab.path));

  return (
    <Container maxW="container.lg" py={8}>
      <Tabs index={activeIndex === -1 ? 0 : activeIndex} variant="enclosed">
        <TabList>
          {teamTabs.map(tab => (
            <Tab key={tab.path} as={NavLink} to={tab.path} _activeLink={{ fontWeight: "bold", color: "green.600" }}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <Box mt={6}>
        <Outlet />
      </Box>
    </Container>
  );
}

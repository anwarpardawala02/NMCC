import { Box, Flex, Link, Button } from "@chakra-ui/react";
import { Routes, Route, Link as RouterLink } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";

export default function App() {
  return (
    <Box>
      {/* Navbar */}
      <Flex as="nav" p={4} bg="teal.500" color="white" justify="space-between">
        <Flex gap={4}>
          <Link as={RouterLink} to="/">Home</Link>
          <Link as={RouterLink} to="/register">Register</Link>
        </Flex>
        <Button size="sm" colorScheme="teal" variant="outline">Login</Button>
      </Flex>

      {/* Routes */}
      <Box p={6}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Box>
    </Box>
  );
}

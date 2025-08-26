import { FixtureManager } from "../components/FixtureManager";
import { Box, Heading } from "@chakra-ui/react";
import { RequireAdmin } from "../routes/RequireAdmin";

export default function FixtureManagerPage() {
  return (
    <RequireAdmin>
      <Box maxW="1200px" mx="auto" p={[4, 6, 8]}>
        <Heading mb={6}>Fixture Management</Heading>
        <FixtureManager />
      </Box>
    </RequireAdmin>
  );
}

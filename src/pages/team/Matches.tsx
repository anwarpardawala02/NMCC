import { useEffect, useState } from "react";
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, VStack, Button, HStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import type { Fixture } from "../../lib/db";
import { listFixtures, getFixtureWithAvailability } from "../../lib/db";
import { useAuth } from "../../hooks/useAuth";

export default function TeamMatches() {
  const [fixtures, setFixtures] = useState<Array<Fixture & { available_count?: number; not_available_count?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Debug user status
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Is admin?", user?.is_admin);
    // Also check local storage directly
    console.log("Local storage:", localStorage.getItem('cricket_club_player'));
  }, [user]);

  useEffect(() => {
    loadFixtures();
  }, []);

  async function loadFixtures() {
    try {
      const fixturesList = await listFixtures();
      
      // Add availability counts
      const enhancedFixtures = await Promise.all(
        fixturesList.map(async (fixture) => {
          const fixtureWithAvailability = await getFixtureWithAvailability(fixture.id);
          return fixtureWithAvailability;
        })
      );
      
      setFixtures(enhancedFixtures);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    } finally {
      setLoading(false);
    }
  }

  // Function to format date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter fixtures to show upcoming ones first
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingFixtures = fixtures.filter(
    fixture => new Date(fixture.fixture_date) >= today
  ).sort((a, b) => 
    new Date(a.fixture_date).getTime() - new Date(b.fixture_date).getTime()
  );
  
  const pastFixtures = fixtures.filter(
    fixture => new Date(fixture.fixture_date) < today
  ).sort((a, b) => 
    new Date(b.fixture_date).getTime() - new Date(a.fixture_date).getTime()
  );

  return (
    <VStack spacing={8} align="stretch">
      <Box textAlign="center">
        <Heading size="xl" mb={2} color="green.600">Match Schedule</Heading>
        <Text color="gray.600">Recent and upcoming matches for Northolt Manor Cricket Club</Text>
        
        <HStack mt={4} spacing={4} justify="center">
          {/* Always visible button for testing */}
          <Button 
            colorScheme="blue"
            size="sm"
            onClick={() => console.log("Clicked test button, user:", user)}
          >
            Test Button (Always Visible)
          </Button>
          
          {/* Temporarily showing for all users for testing */}
          <Button 
            as={RouterLink}
            to="/fixtures/manage"
            colorScheme="green"
            size="sm"
            rightIcon={<ExternalLinkIcon />}
          >
            Manage Fixtures (Admin Only)
          </Button>
        </HStack>
      </Box>

      {/* Upcoming Fixtures */}
      <Box>
        <Heading size="md" mb={4} color="blue.600">Upcoming Fixtures</Heading>
        {loading ? (
          <Box textAlign="center" py={4}>
            <Text>Loading fixtures...</Text>
          </Box>
        ) : upcomingFixtures.length === 0 ? (
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" textAlign="center">
            <Text>No upcoming fixtures scheduled yet.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" bg="white" borderRadius="lg">
              <Thead bg="blue.500">
                <Tr>
                  <Th color="white">Date</Th>
                  <Th color="white">Opponent</Th>
                  <Th color="white">Ground</Th>
                  <Th color="white">Home/Away</Th>
                  <Th color="white">Availability</Th>
                </Tr>
              </Thead>
              <Tbody>
                {upcomingFixtures.map((fixture) => (
                  <Tr key={fixture.id}>
                    <Td fontWeight="medium">{formatDate(fixture.fixture_date)}</Td>
                    <Td>{fixture.opponent}</Td>
                    <Td>{fixture.venue}</Td>
                    <Td>
                      <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                        {fixture.home_away.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={3}>
                        <Box>
                          <Badge mr={2} colorScheme="green">
                            Available: {fixture.available_count || 0}
                          </Badge>
                          <Badge colorScheme="red">
                            Not Available: {fixture.not_available_count || 0}
                          </Badge>
                        </Box>
                        {user && (
                          <Button
                            as={RouterLink}
                            to={`/fixtures/${fixture.id}/availability`}
                            colorScheme="blue"
                            size="xs"
                            rightIcon={<ExternalLinkIcon />}
                          >
                            Respond
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Past Fixtures */}
      <Box>
        <Heading size="md" mb={4} color="blue.600">Past Fixtures</Heading>
        {loading ? (
          <Box textAlign="center" py={4}>
            <Text>Loading fixtures...</Text>
          </Box>
        ) : pastFixtures.length === 0 ? (
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" textAlign="center">
            <Text>No past fixtures found.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" bg="white" borderRadius="lg">
              <Thead bg="blue.500">
                <Tr>
                  <Th color="white">Date</Th>
                  <Th color="white">Opponent</Th>
                  <Th color="white">Ground</Th>
                  <Th color="white">Home/Away</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pastFixtures.map((fixture) => (
                  <Tr key={fixture.id} opacity={0.7}>
                    <Td fontWeight="medium">{formatDate(fixture.fixture_date)}</Td>
                    <Td>{fixture.opponent}</Td>
                    <Td>{fixture.venue}</Td>
                    <Td>
                      <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                        {fixture.home_away.toUpperCase()}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </VStack>
  );
}

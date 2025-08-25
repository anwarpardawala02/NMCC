import { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Badge, 
  Avatar,
  HStack,
  Spinner,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import type { Fixture, Availability } from '../lib/db';
import { getFixtureWithAvailability } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

export default function FixtureAvailabilityDetailPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [fixture, setFixture] = useState<Fixture & { available_count?: number, not_available_count?: number } | null>(null);
  const [availabilityList, setAvailabilityList] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fixtureId) {
      loadFixtureDetails();
    }
  }, [fixtureId]);

  async function loadFixtureDetails() {
    setLoading(true);
    try {
      if (!fixtureId) return;
      
      // Load fixture details
      const fixtureData = await getFixtureWithAvailability(fixtureId);
      setFixture(fixtureData);
      
      // Load availability responses via read-only RPC to avoid player RLS issues
      const { data, error } = await supabase
        .rpc('get_fixture_availability', { p_fixture_id: fixtureId });
      if (error) throw error;
        // Map RPC rows to Availability shape used by UI
        let mapped: Availability[] = (data || []).map((row: any) => ({
        id: row.id,
        fixture_id: row.fixture_id,
        player_id: row.player_id,
        status: row.status,
        responded_on: row.responded_on,
        player: {
          id: row.player_id,
          full_name: row.player_full_name,
          email: '',
          phone: '',
          join_date: '',
          active: true,
          is_admin: false,
          created_at: '',
          photo_url: row.player_photo_url,
        } as any
      }));
        // Fallback: if RPC returns empty (or function not deployed), fetch plain availability rows
        if (!mapped.length) {
          const { data: plain } = await supabase
            .from('availability')
            .select('*')
            .eq('fixture_id', fixtureId);
          if (plain && Array.isArray(plain)) {
            mapped = plain as Availability[];
          }
        }
      setAvailabilityList(mapped);
    } catch (error) {
      console.error('Failed to load fixture details:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading fixture details...</Text>
      </Box>
    );
  }

  if (!fixture) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Fixture not found</Text>
      </Box>
    );
  }

  // Group players by availability status
  const availablePlayers = availabilityList.filter(a => a.status === 'Available');
  const notAvailablePlayers = availabilityList.filter(a => a.status === 'Not Available');
  const availableCount = (fixture as any)?.available_count ?? availablePlayers.length;
  const notAvailableCount = (fixture as any)?.not_available_count ?? notAvailablePlayers.length;

  return (
    <Box maxW="1200px" mx="auto" p={[4, 6, 8]}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Fixture Availability Details</Heading>
        
        <Card>
          <CardHeader>
            <Heading size="md">Match Details</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Text fontWeight="bold" minW="100px">Opponent:</Text>
                <Text>{fixture.opponent}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="100px">Date:</Text>
                <Text>{new Date(fixture.fixture_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="100px">Ground:</Text>
                <Text>{fixture.venue}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="100px">Home/Away:</Text>
                <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                  {fixture.home_away.toUpperCase()}
                </Badge>
              </HStack>
              {fixture.notes && (
                <HStack alignItems="flex-start">
                  <Text fontWeight="bold" minW="100px">Notes:</Text>
                  <Text>{fixture.notes}</Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
        
        <HStack spacing={6} align="stretch" wrap="wrap">
          <Card flex="1" minW="300px">
            <CardHeader bg="green.50">
              <HStack justify="space-between">
                <Heading size="md" color="green.700">Available Players</Heading>
                <Badge colorScheme="green" fontSize="md" px={2}>{availableCount}</Badge>
                <Badge colorScheme="green" fontSize="md" px={2}>{availableCount}</Badge>
              </HStack>
            </CardHeader>
            <CardBody p={0}>
              {availablePlayers.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">No players available yet</Text>
                </Box>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Player</Th>
                      <Th>Responded</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {availablePlayers.map(item => (
                      <Tr key={item.id}>
                        <Td>
                          <HStack>
                            <Avatar 
                              size="sm" 
                              name={item.player?.full_name} 
                              src={item.player?.photo_url} 
                              bg="green.100"
                            />
                            <Text>{item.player?.full_name || 'Unknown Player'}</Text>
                          </HStack>
                        </Td>
                        <Td>{new Date(item.responded_on).toLocaleDateString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          
          <Card flex="1" minW="300px">
            <CardHeader bg="red.50">
              <HStack justify="space-between">
                <Heading size="md" color="red.700">Not Available</Heading>
                <Badge colorScheme="red" fontSize="md" px={2}>{notAvailableCount}</Badge>
              </HStack>
            </CardHeader>
            <CardBody p={0}>
              {notAvailablePlayers.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">No responses yet</Text>
                </Box>
              ) : (
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Player</Th>
                      <Th>Responded</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {notAvailablePlayers.map(item => (
                      <Tr key={item.id}>
                        <Td>
                          <HStack>
                            <Avatar 
                              size="sm" 
                              name={item.player?.full_name} 
                              src={item.player?.photo_url} 
                              bg="red.100"
                            />
                            <Text>{item.player?.full_name || 'Unknown Player'}</Text>
                          </HStack>
                        </Td>
                        <Td>{new Date(item.responded_on).toLocaleDateString()}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </HStack>
      </VStack>
    </Box>
  );
}

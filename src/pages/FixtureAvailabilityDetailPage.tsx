
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
  Button,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Fixture, Availability, Player } from '../lib/db';
import { getFixtureWithAvailability, listPlayers, getFixtureAvailability } from '../lib/db';
import { SendWhatsAppPollButton } from '../components/SendWhatsAppPollButton';
import { SendReminderButton } from '../components/SendReminderButton';

export default function FixtureAvailabilityDetailPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const [fixture, setFixture] = useState<Fixture & { available_count?: number, not_available_count?: number } | null>(null);
  const [availabilityList, setAvailabilityList] = useState<Availability[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fixtureId) {
      loadFixtureDetails();
    }
    // eslint-disable-next-line
  }, [fixtureId]);

  async function loadFixtureDetails() {
    setLoading(true);
    try {
      if (!fixtureId) return;
      const fixtureData = await getFixtureWithAvailability(fixtureId);
      const playersList = await listPlayers(true);  // Changed: true to get full player data including phone
      const availabilityData = await getFixtureAvailability(fixtureId);
      setFixture(fixtureData);
      setPlayers(playersList);
      setAvailabilityList(availabilityData);
    } catch (error) {
      console.error('Failed to load fixture details:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxW="4xl" mx="auto" mt={8}>
      <VStack align="stretch" spacing={6}>
        <Button onClick={() => navigate(-1)} alignSelf="flex-start" colorScheme="blue" variant="outline" size="sm">Back</Button>
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Fixture Details</Heading>
              {fixture && (
                <HStack spacing={2}>
                  <SendWhatsAppPollButton 
                    fixture={fixture}
                    players={players}
                    onSendComplete={() => loadFixtureDetails()}
                  />
                  <SendReminderButton 
                    fixture={fixture}
                    onSendComplete={() => loadFixtureDetails()}
                  />
                </HStack>
              )}
            </HStack>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Spinner />
            ) : fixture ? (
              <>
                <Text fontWeight="bold">{fixture.opponent}</Text>
                <Text>Date: {fixture.fixture_date}</Text>
                <Text>Venue: {fixture.venue}</Text>
                <HStack spacing={4} mt={2}>
                  <Badge colorScheme="green">Available: {fixture.available_count ?? 0}</Badge>
                  <Badge colorScheme="red">Not Available: {fixture.not_available_count ?? 0}</Badge>
                </HStack>
              </>
            ) : (
              <Text>No fixture found.</Text>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Heading size="sm">Player Availability</Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Spinner />
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Player</Th>
                    <Th>Status</Th>
                    <Th>Responded On</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {availabilityList.map((a) => (
                    <Tr key={a.id}>
                      <Td>
                        <HStack>
                          <Avatar size="xs" src={a.player?.photo_url || undefined} name={a.player?.full_name} />
                          <Text>{a.player?.full_name || a.player_id}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={a.status === 'Available' ? 'green' : a.status === 'Not Available' ? 'red' : 'gray'}>
                          {a.status}
                        </Badge>
                      </Td>
                      <Td>{a.responded_on ? new Date(a.responded_on).toLocaleString() : '-'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
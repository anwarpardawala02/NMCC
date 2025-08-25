import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Container,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Checkbox
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon } from "@chakra-ui/icons";
import { MdLocationOn } from 'react-icons/md';
import { listMatches, getMatchAvailability, setMatchAvailability } from "../lib/db";
import { useAuth } from "../hooks/useAuth";
import type { Match, MatchAvailability } from "../lib/db";

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [availability, setAvailability] = useState<MatchAvailability[]>([]);
  const [userAvailability, setUserAvailability] = useState<boolean | null>(null);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const data = await listMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  }

  async function openAvailabilityModal(match: Match) {
    setSelectedMatch(match);
    try {
      const data = await getMatchAvailability(match.id);
      setAvailability(data);
      
      // Find current user's availability
      const userAvail = data.find(a => a.player_id === user?.id);
      setUserAvailability(userAvail ? userAvail.available : null);
    } catch (error) {
      console.error('Failed to load availability:', error);
    }
    onOpen();
  }

  async function handleAvailabilityChange(available: boolean) {
    if (!user || !selectedMatch) return;
    
    try {
      await setMatchAvailability(selectedMatch.id, user.id, available);
      setUserAvailability(available);
      
      // Refresh availability data
      const data = await getMatchAvailability(selectedMatch.id);
      setAvailability(data);
      
      toast({
        title: "Availability Updated",
        description: `You are marked as ${available ? 'available' : 'unavailable'} for this match`,
        status: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
      });
    }
  }

  const upcomingMatches = matches.filter(match => {
    const today = new Date().toISOString().split('T')[0];
    return match.match_date >= today && match.status === 'scheduled';
  });

  const pastMatches = matches.filter(match => {
    const today = new Date().toISOString().split('T')[0];
    return match.match_date < today || match.status === 'completed';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'green';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const MatchCard = ({ match, isPast = false }: { match: Match; isPast?: boolean }) => (
    <Box 
      p={6} 
      borderWidth={1} 
      borderRadius="lg" 
      bg="white"
      _hover={{ shadow: 'md' }}
      transition="box-shadow 0.2s"
    >
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="full">
          <Badge colorScheme={match.home_away === 'home' ? 'green' : 'blue'}>
            {match.home_away.toUpperCase()}
          </Badge>
          <Badge colorScheme={getStatusColor(match.status)}>
            {match.status.toUpperCase()}
          </Badge>
        </HStack>
        
        <Heading size="md">vs {match.opponent}</Heading>
        
        <VStack align="start" spacing={2} fontSize="sm" color="gray.600">
          <HStack>
            <CalendarIcon boxSize={4} />
            <Text>{new Date(match.match_date).toLocaleDateString()}</Text>
          </HStack>
          
          {match.match_time && (
            <HStack>
              <TimeIcon boxSize={4} />
              <Text>{match.match_time}</Text>
            </HStack>
          )}
          
          <HStack>
            <MdLocationOn size={16} />
            <Text>{match.venue}</Text>
          </HStack>
        </VStack>
        
        <Badge colorScheme="purple" textTransform="capitalize">
          {match.match_type}
        </Badge>
        
        {!isPast && user && (
          <Button 
            size="sm" 
            colorScheme="green" 
            variant="outline"
            onClick={() => openAvailabilityModal(match)}
          >
            Set Availability
          </Button>
        )}
      </VStack>
    </Box>
  );

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Fixtures & Results
          </Heading>
          <Text color="gray.600">
            View upcoming matches and set your availability
          </Text>
        </Box>

        {/* Upcoming Matches */}
        <Box>
          <Heading size="lg" mb={6}>Upcoming Matches</Heading>
          {upcomingMatches.length === 0 ? (
            <Box textAlign="center" py={8} bg="gray.50" borderRadius="lg">
              <Text color="gray.500">No upcoming matches scheduled</Text>
            </Box>
          ) : (
            <SimpleGrid columns={[1, 2, 3]} spacing={6}>
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Past Matches */}
        {pastMatches.length > 0 && (
          <Box>
            <Heading size="lg" mb={6}>Recent Results</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={6}>
              {pastMatches.slice(0, 6).map((match) => (
                <MatchCard key={match.id} match={match} isPast />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>

      {/* Availability Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Match Availability - vs {selectedMatch?.opponent}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>
                  {new Date(selectedMatch?.match_date || '').toLocaleDateString()}
                </Text>
                <Text color="gray.600">{selectedMatch?.venue}</Text>
              </Box>

              {user && (
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontWeight="bold" mb={3}>Your Availability:</Text>
                  <VStack spacing={2} align="start">
                    <Checkbox
                      isChecked={userAvailability === true}
                      onChange={() => handleAvailabilityChange(true)}
                    >
                      Available to play
                    </Checkbox>
                    <Checkbox
                      isChecked={userAvailability === false}
                      onChange={() => handleAvailabilityChange(false)}
                    >
                      Not available
                    </Checkbox>
                  </VStack>
                </Box>
              )}

              <Box>
                <Text fontWeight="bold" mb={3}>
                  Player Availability ({availability.filter(a => a.available).length} available):
                </Text>
                <VStack spacing={1} align="start">
                  {availability.map((avail) => (
                    <HStack key={avail.id}>
                      <Badge colorScheme={avail.available ? 'green' : 'red'}>
                        {avail.available ? '✓' : '✗'}
                      </Badge>
                      <Text>{avail.player?.full_name}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
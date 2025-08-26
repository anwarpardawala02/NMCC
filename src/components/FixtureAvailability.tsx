import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  useToast,
  Badge,
  Spinner,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Fixture } from '../lib/db';
import { getFixtureWithAvailability, setAvailability } from '../lib/db';

export function FixtureAvailability() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [fixture, setFixture] = useState<Fixture & { available_count?: number, not_available_count?: number } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Available' | 'Not Available' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (fixtureId) {
      loadFixtureDetails();
    }
  }, [fixtureId]);

  async function loadFixtureDetails() {
    setIsLoading(true);
    try {
      if (!fixtureId) return;
      const data = await getFixtureWithAvailability(fixtureId);
      setFixture(data);
    } catch (error) {
      console.error('Failed to load fixture:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fixture details',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!user || !fixtureId || !selectedStatus) return;
    
    setIsSubmitting(true);
    try {
      await setAvailability(fixtureId, user.id, selectedStatus);
      toast({
        title: 'Response Submitted',
        description: `You have marked yourself as ${selectedStatus.toLowerCase()} for this fixture`,
        status: 'success',
      });
      await loadFixtureDetails();
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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

  return (
    <Box maxW="800px" mx="auto" p={[4, 6, 8]} bg="white" borderRadius="lg" shadow="md">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center">Fixture Response</Heading>
        
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
              <HStack>
                <Text fontWeight="bold" minW="100px">Availability:</Text>
                <HStack>
                  <Badge colorScheme="green" px={2} py={1}>
                    Available: {fixture.available_count || 0}
                  </Badge>
                  <Badge colorScheme="red" px={2} py={1}>
                    Not Available: {fixture.not_available_count || 0}
                  </Badge>
                </HStack>
              </HStack>
              <HStack>
                <Button
                  as={RouterLink}
                  to={`/fixtures/${fixture.id}/availability-detail`}
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                >
                  View responses
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Your Response</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Text>Are you available to play in this match?</Text>
              
              <HStack spacing={4} justify="center" w="full">
                <Button
                  colorScheme={selectedStatus === 'Available' ? 'green' : 'gray'}
                  variant={selectedStatus === 'Available' ? 'solid' : 'outline'}
                  size="lg"
                  width="150px"
                  onClick={() => setSelectedStatus('Available')}
                >
                  Available
                </Button>
                
                <Button
                  colorScheme={selectedStatus === 'Not Available' ? 'red' : 'gray'}
                  variant={selectedStatus === 'Not Available' ? 'solid' : 'outline'}
                  size="lg"
                  width="150px"
                  onClick={() => setSelectedStatus('Not Available')}
                >
                  Not Available
                </Button>
              </HStack>
              
              <Button
                colorScheme="blue"
                isLoading={isSubmitting}
                loadingText="Submitting"
                disabled={!selectedStatus}
                onClick={handleSubmit}
                w="full"
                mt={4}
              >
                Submit Response
              </Button>
              
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Note: By marking yourself as available, you are committing to play and a match fee will be added to your account.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

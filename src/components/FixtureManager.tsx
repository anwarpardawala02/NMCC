import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Text,
  useToast,
  HStack,
  Spinner,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronDownIcon, ExternalLinkIcon, AddIcon } from '@chakra-ui/icons';
import type { Fixture } from '../lib/db';
import { listFixtures, getFixtureAvailability } from '../lib/db';
import { AdminFixtureForm } from './AdminFixtureForm';

export function FixtureManager() {
  const [fixtures, setFixtures] = useState<Array<Fixture & { available_count?: number, not_available_count?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadFixtures();
  }, []);

  async function loadFixtures() {
    setLoading(true);
    try {
      const fixturesList = await listFixtures();
      
      // Add availability counts
      const enhancedFixtures = await Promise.all(
        fixturesList.map(async (fixture) => {
          const availability = await getFixtureAvailability(fixture.id);
          const availableCount = availability.filter(a => a.status === 'Available').length;
          const notAvailableCount = availability.filter(a => a.status === 'Not Available').length;
          
          return {
            ...fixture,
            available_count: availableCount,
            not_available_count: notAvailableCount,
          };
        })
      );
      
      setFixtures(enhancedFixtures);
    } catch (error) {
      console.error('Failed to load fixtures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fixtures',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

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
      <Heading size="lg">Fixture Manager</Heading>

      {/* Add Fixture Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Fixture</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <AdminFixtureForm onSuccess={() => {
              onClose();
              loadFixtures();
              toast({
                title: "Fixture added",
                description: "The new fixture has been created successfully",
                status: "success"
              });
            }} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Box>
        <HStack mb={4} justify="space-between">
          <Heading size="md">Upcoming Fixtures</Heading>
          <Button
            onClick={onOpen}
            colorScheme="blue"
            size="sm"
            leftIcon={<AddIcon />}
          >
            Add New Fixture
          </Button>
        </HStack>

        {loading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" />
            <Text mt={2}>Loading fixtures...</Text>
          </Box>
        ) : upcomingFixtures.length === 0 ? (
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
            <Text>No upcoming fixtures found</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" bg="white" borderRadius="lg" boxShadow="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Date</Th>
                  <Th>Opponent</Th>
                  <Th>Ground</Th>
                  <Th>Home/Away</Th>
                  <Th>Availability</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {upcomingFixtures.map(fixture => (
                  <Tr key={fixture.id}>
                    <Td whiteSpace="nowrap">
                      {new Date(fixture.fixture_date).toLocaleDateString('en-GB')}
                    </Td>
                    <Td>{fixture.opponent}</Td>
                    <Td>{fixture.venue}</Td>
                    <Td>
                      <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                        {fixture.home_away.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <Badge colorScheme="green" px={2}>
                          {fixture.available_count || 0}
                        </Badge>
                        <Badge colorScheme="red" px={2}>
                          {fixture.not_available_count || 0}
                        </Badge>
                      </HStack>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                          Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            as={RouterLink} 
                            to={`/fixtures/${fixture.id}/availability-detail`}
                            icon={<ExternalLinkIcon />}
                          >
                            View Availability
                          </MenuItem>
                          <MenuItem
                            as={RouterLink}
                            to={`/fixtures/${fixture.id}/send-reminder`}
                          >
                            Send Reminder
                          </MenuItem>
                          <MenuItem
                            as={RouterLink}
                            to={`/fixtures/${fixture.id}/select-team`}
                          >
                            Select Team
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Box>
        <Heading size="md" mb={4}>Past Fixtures</Heading>
        {loading ? (
          <Spinner />
        ) : pastFixtures.length === 0 ? (
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
            <Text>No past fixtures found</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" bg="white" borderRadius="lg" boxShadow="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Date</Th>
                  <Th>Opponent</Th>
                  <Th>Ground</Th>
                  <Th>Home/Away</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pastFixtures.map(fixture => (
                  <Tr key={fixture.id} opacity={0.7}>
                    <Td whiteSpace="nowrap">
                      {new Date(fixture.fixture_date).toLocaleDateString('en-GB')}
                    </Td>
                    <Td>{fixture.opponent}</Td>
                    <Td>{fixture.venue}</Td>
                    <Td>
                      <Badge colorScheme={fixture.home_away === 'home' ? "green" : "blue"}>
                        {fixture.home_away.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        as={RouterLink}
                        to={`/fixtures/${fixture.id}/availability`}
                        aria-label="View availability"
                        icon={<ExternalLinkIcon />}
                        size="sm"
                      />
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

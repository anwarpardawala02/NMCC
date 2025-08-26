import { useEffect, useState } from "react";
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Badge, VStack, Button, HStack, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, Select, Textarea, Menu, MenuButton, MenuList, MenuItem, useToast } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import type { Fixture } from "../../lib/db";
import { listFixtures, getFixtureWithAvailability, createFixture, updateFixture, deleteFixture } from "../../lib/db";
import { useAuth } from "../../hooks/useAuth";

export default function TeamMatches() {
  const [fixtures, setFixtures] = useState<Array<Fixture & { available_count?: number; not_available_count?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState<Fixture | null>(null);
  const [form, setForm] = useState<Omit<Fixture, 'id' | 'created_at'>>({
    opponent: '',
    fixture_date: new Date().toISOString().slice(0, 10),
    venue: '',
    home_away: 'home',
    status: 'scheduled',
    notes: ''
  });
  
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

  function openCreate() {
    setEditing(null);
    setForm({
      opponent: '',
      fixture_date: new Date().toISOString().slice(0, 10),
      venue: '',
      home_away: 'home',
      status: 'scheduled',
      notes: ''
    });
    onOpen();
  }

  function openEdit(f: Fixture) {
    setEditing(f);
    setForm({
      opponent: f.opponent,
      fixture_date: f.fixture_date,
      venue: f.venue,
      home_away: f.home_away,
      status: f.status,
      notes: f.notes || ''
    });
    onOpen();
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateFixture(editing.id, form);
        toast({ title: 'Fixture updated', status: 'success' });
      } else {
        await createFixture(form);
        toast({ title: 'Fixture created', status: 'success' });
      }
      onClose();
      await loadFixtures();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save fixture', status: 'error' });
    }
  }

  async function handleDelete(f: Fixture) {
    if (!confirm('Delete this fixture?')) return;
    try {
      await deleteFixture(f.id);
      toast({ title: 'Fixture deleted', status: 'success' });
      await loadFixtures();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete', status: 'error' });
    }
  }

  function copyLink(kind: 'respond' | 'view', id: string) {
    const url = kind === 'respond' ? `${window.location.origin}/fixtures/${id}/availability` : `${window.location.origin}/fixtures/${id}/availability-detail`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: url, status: 'info' });
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
          {user?.is_admin && (
            <Button colorScheme="green" size="sm" onClick={openCreate}>
              New Fixture
            </Button>
          )}
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
                  <Th color="white">Actions</Th>
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
                        <Badge mr={2} colorScheme="green">
                          Available: {fixture.available_count || 0}
                        </Badge>
                        <Badge colorScheme="red">
                          Not Available: {fixture.not_available_count || 0}
                        </Badge>
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          as={RouterLink}
                          to={`/fixtures/${fixture.id}/availability-detail`}
                          size="xs"
                          variant="outline"
                          rightIcon={<ExternalLinkIcon />}
                        >
                          View
                        </Button>
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
                        {user?.is_admin && (
                          <Menu>
                            <MenuButton as={Button} size="xs" variant="outline">
                              Actions
                            </MenuButton>
                            <MenuList>
                              <MenuItem onClick={() => openEdit(fixture)}>Edit</MenuItem>
                              <MenuItem onClick={() => handleDelete(fixture)}>Delete</MenuItem>
                              <MenuItem onClick={() => copyLink('respond', fixture.id)}>Copy Respond Link</MenuItem>
                              <MenuItem onClick={() => copyLink('view', fixture.id)}>Copy View Link</MenuItem>
                            </MenuList>
                          </Menu>
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
                  <Th color="white">Actions</Th>
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
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          as={RouterLink}
                          to={`/fixtures/${fixture.id}/availability-detail`}
                          size="xs"
                          variant="outline"
                          rightIcon={<ExternalLinkIcon />}
                        >
                          View
                        </Button>
                        {user?.is_admin && (
                          <Menu>
                            <MenuButton as={Button} size="xs" variant="outline">
                              Actions
                            </MenuButton>
                            <MenuList>
                              <MenuItem onClick={() => openEdit(fixture)}>Edit</MenuItem>
                              <MenuItem onClick={() => handleDelete(fixture)}>Delete</MenuItem>
                              <MenuItem onClick={() => copyLink('respond', fixture.id)}>Copy Respond Link</MenuItem>
                              <MenuItem onClick={() => copyLink('view', fixture.id)}>Copy View Link</MenuItem>
                            </MenuList>
                          </Menu>
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

      {/* Create/Edit Fixture Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Edit Fixture' : 'New Fixture'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Opponent</FormLabel>
                <Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input type="date" value={form.fixture_date} onChange={(e) => setForm({ ...form, fixture_date: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Ground</FormLabel>
                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Home/Away</FormLabel>
                <Select value={form.home_away} onChange={(e) => setForm({ ...form, home_away: e.target.value as 'home' | 'away' })}>
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

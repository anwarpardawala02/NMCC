import { useState, useEffect } from 'react';
import { 
  VStack, 
  HStack,
  FormControl, 
  FormLabel, 
  Input, 
  Textarea,
  Select,
  Button,
  useToast,
  Box,
  Heading,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Image
} from '@chakra-ui/react';
import { createSponsor, listSponsors } from '../lib/db';
import type { Sponsor } from '../lib/db';

export function AdminSponsorForm() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    description: '',
    tier: 'bronze' as 'platinum' | 'gold' | 'silver' | 'bronze',
    active: true
  });
  const toast = useToast();

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const data = await listSponsors();
      setSponsors(data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createSponsor(form);
      toast({
        title: 'Sponsor Added',
        description: 'New sponsor has been added successfully',
        status: 'success'
      });
      setForm({
        name: '',
        logo_url: '',
        website_url: '',
        description: '',
        tier: 'bronze',
        active: true
      });
      loadSponsors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const tierColors = {
    platinum: 'purple',
    gold: 'yellow',
    silver: 'gray',
    bronze: 'orange'
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Add New Sponsor</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Sponsor Name</FormLabel>
                <Input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Company or organization name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Sponsorship Tier</FormLabel>
                <Select
                  value={form.tier}
                  onChange={e => setForm(prev => ({ ...prev, tier: e.target.value as any }))}
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Logo URL</FormLabel>
                <Input
                  value={form.logo_url}
                  onChange={e => setForm(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Website URL</FormLabel>
                <Input
                  value={form.website_url}
                  onChange={e => setForm(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the sponsor"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <HStack>
                <FormLabel mb={0}>Active</FormLabel>
                <Switch
                  isChecked={form.active}
                  onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                />
              </HStack>
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Adding..."
              w="full"
            >
              Add Sponsor
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>Current Sponsors</Heading>
        <Box overflowX="auto">
          <Table variant="simple" bg="white" borderRadius="lg">
            <Thead>
              <Tr>
                <Th>Logo</Th>
                <Th>Name</Th>
                <Th>Tier</Th>
                <Th>Website</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sponsors.map(sponsor => (
                <Tr key={sponsor.id}>
                  <Td>
                    {sponsor.logo_url ? (
                      <Image src={sponsor.logo_url} alt={sponsor.name} maxH="40px" maxW="80px" objectFit="contain" />
                    ) : (
                      <Box w="80px" h="40px" bg="gray.100" borderRadius="md" />
                    )}
                  </Td>
                  <Td>{sponsor.name}</Td>
                  <Td>
                    <Badge colorScheme={tierColors[sponsor.tier]} textTransform="capitalize">
                      {sponsor.tier}
                    </Badge>
                  </Td>
                  <Td>
                    {sponsor.website_url ? (
                      <Button as="a" href={sponsor.website_url} target="_blank" size="sm" variant="outline">
                        Visit
                      </Button>
                    ) : (
                      'N/A'
                    )}
                  </Td>
                  <Td>
                    <Badge colorScheme={sponsor.active ? 'green' : 'red'}>
                      {sponsor.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
}
import { useState, useEffect } from 'react';
import { VStack, HStack, FormControl, FormLabel, Input, Textarea, Button, useToast, Box, Heading, IconButton, Badge, Progress, Text } from '@chakra-ui/react';
import { Plus, Minus } from 'lucide-react';
import { createPoll, listPolls } from '../lib/db';
import type { Poll } from '../lib/db';

export function AdminPollForm() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    expires_at: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadPolls();
  }, []);

  async function loadPolls() {
    try {
      const data = await listPolls();
      setPolls(data);
    } catch (error) {
      console.error('Failed to load polls:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validOptions = form.options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        throw new Error('At least 2 options are required');
      }

      await createPoll({
        ...form,
        options: validOptions,
        expires_at: form.expires_at || undefined,
        active: true
      });
      
      toast({
        title: 'Poll Created',
        description: 'New poll has been created successfully',
        status: 'success'
      });
      
      setForm({
        title: '',
        description: '',
        options: ['', ''],
        expires_at: ''
      });
      loadPolls();
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

  const addOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    if (form.options.length > 2) {
      setForm(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const getPollResults = (poll: Poll) => {
    const totalVotes = Object.keys(poll.votes).length;
    const results = poll.options.map(option => {
      const votes = Object.values(poll.votes).filter(vote => vote === option).length;
      return {
        option,
        votes,
        percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0
      };
    });
    return { results, totalVotes };
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <Heading size="md" mb={4}>Create New Poll</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Poll Title</FormLabel>
              <Input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What would you like to ask?"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about the poll"
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Expiry Date (Optional)</FormLabel>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Poll Options</FormLabel>
              <VStack spacing={2} align="stretch">
                {form.options.map((option, index) => (
                  <HStack key={index}>
                    <Input
                      value={option}
                      onChange={e => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <IconButton
                      aria-label="Remove option"
                      icon={<Minus />}
                      size="sm"
                      onClick={() => removeOption(index)}
                      isDisabled={form.options.length <= 2}
                    />
                  </HStack>
                ))}
                <Button
                  leftIcon={<Plus />}
                  onClick={addOption}
                  variant="outline"
                  size="sm"
                  alignSelf="start"
                >
                  Add Option
                </Button>
              </VStack>
            </FormControl>

            <Button
              type="submit"
              colorScheme="green"
              isLoading={loading}
              loadingText="Creating..."
              w="full"
            >
              Create Poll
            </Button>
          </VStack>
        </form>
      </Box>

      <Box>
        <Heading size="md" mb={4}>Active Polls</Heading>
        <VStack spacing={4} align="stretch">
          {polls.map(poll => {
            const { results, totalVotes } = getPollResults(poll);
            return (
              <Box key={poll.id} p={4} borderWidth={1} borderRadius="lg" bg="white">
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" w="full">
                    <Heading size="sm">{poll.title}</Heading>
                    <Badge colorScheme={poll.active ? 'green' : 'gray'}>
                      {poll.active ? 'Active' : 'Closed'}
                    </Badge>
                  </HStack>
                  
                  {poll.description && (
                    <Text fontSize="sm" color="gray.600">{poll.description}</Text>
                  )}
                  
                  <Box w="full">
                    <Text fontSize="sm" mb={2}>Results ({totalVotes} votes):</Text>
                    {results.map((result, index) => (
                      <Box key={index} mb={2}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">{result.option}</Text>
                          <Text fontSize="sm">{result.votes} ({result.percentage.toFixed(1)}%)</Text>
                        </HStack>
                        <Progress value={result.percentage} colorScheme="green" size="sm" />
                      </Box>
                    ))}
                  </Box>
                  
                  {poll.expires_at && (
                    <Text fontSize="xs" color="gray.500">
                      Expires: {new Date(poll.expires_at).toLocaleString()}
                    </Text>
                  )}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </VStack>
  );
}
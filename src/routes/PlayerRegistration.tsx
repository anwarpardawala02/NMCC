import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, useToast, VStack } from '@chakra-ui/react';
import { PhotoUploader } from '../components/PhotoUploader';
import { registerPlayer } from '../lib/db';

export function PlayerRegistration() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    photo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerPlayer(form);
      toast({
        title: 'Registration successful!',
        description: 'Welcome to Northolt Manor Cricket Club.',
        status: 'success',
      });
      setForm({ full_name: '', email: '', phone: '', photo_url: '' });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setForm(prev => ({ ...prev, photo_url: url }));
  };

  return (
    <Box maxW="md" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel htmlFor="full_name">Full Name</FormLabel>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="phone">Phone</FormLabel>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Profile Photo (Optional)</FormLabel>
            <PhotoUploader onSuccess={url => handlePhotoUploaded(url)} />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="Registering..."
            w="full"
          >
            Register
          </Button>
        </VStack>
      </form>
    </Box>
  );
}

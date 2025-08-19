import { useState } from "react";
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading,
  Text,
  useToast,
  Container
} from "@chakra-ui/react";
import { registerPlayer } from "../lib/db";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      await registerPlayer(form);
      toast({
        title: "Registration Successful!",
        description: "Welcome to Northolt Manor Cricket Club. We'll be in touch soon.",
        status: "success",
        duration: 5000,
      });
      setForm({ full_name: "", email: "", phone: "" });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Join Our Club
          </Heading>
          <Text color="gray.600">
            Register to become a member of Northolt Manor Cricket Club
          </Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={loading}
                loadingText="Registering..."
              >
                Register
              </Button>
            </VStack>
          </form>
        </Box>

        <Box p={4} bg="blue.50" borderRadius="lg">
          <Text fontSize="sm" color="blue.800">
            <strong>What happens next?</strong><br />
            After registration, a club official will contact you within 48 hours to discuss 
            membership details, training schedules, and answer any questions you may have.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
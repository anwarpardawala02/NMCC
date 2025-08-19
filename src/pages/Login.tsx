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
  Container,
  Alert,
  AlertIcon
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await signIn(email);
      toast({
        title: "Magic Link Sent!",
        description: "Check your email for the sign-in link.",
        status: "success",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
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
            Sign In
          </Heading>
          <Text color="gray.600">
            Enter your email to receive a magic link for signing in
          </Text>
        </Box>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Magic Link Authentication</Text>
            <Text fontSize="sm">
              We'll send you a secure link to sign in. No password required!
            </Text>
          </Box>
        </Alert>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={loading}
                loadingText="Sending Magic Link..."
              >
                Send Magic Link
              </Button>
            </VStack>
          </form>
        </Box>

        <Box p={4} bg="gray.50" borderRadius="lg">
          <Text fontSize="sm" color="gray.600">
            <strong>New to the club?</strong> You'll need to register first before you can sign in. 
            Club administrators will activate your account once your registration is approved.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
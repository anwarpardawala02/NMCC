import { useState } from "react";
import { 
  Box, 
  Button, 
  VStack, 
  Heading,
  Text,
  useToast,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  FormControl,
  FormLabel,
  Input
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../lib/authService";

export default function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    login_name: "",
    password: "dev-mode-no-password" // Password is not used in dev mode
  });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!credentials.login_name) {
      toast({
        title: "Missing Username",
        description: "Please enter your username to login.",
        status: "warning",
        duration: 5000,
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log("Attempting to sign in with:", credentials.login_name);
      const user = await signIn(credentials);
      
      toast({
        title: "Login Successful!",
        description: user.is_admin ? 
          "Welcome admin! You now have access to administrative features." : 
          "You have been logged in successfully.",
        status: "success",
        duration: 5000,
      });
      
      // Redirect to home page after successful login
      navigate('/');
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed. Please check your username.",
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
            Enter your credentials to sign in
          </Text>
        </Box>
        
        <Alert status="info" variant="solid" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Development Mode</AlertTitle>
          <Text fontSize="sm">Just enter any username - no password needed. All users are granted admin access.</Text>
        </Alert>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={credentials.login_name}
                  onChange={(e) => setCredentials({...credentials, login_name: e.target.value})}
                  placeholder="Enter your username"
                />
              </FormControl>

              <Text fontSize="sm" color="gray.500">
                Development mode: Enter your username from the players table
              </Text>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
                isLoading={loading}
                loadingText="Signing In..."
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </Box>

        <Box p={4} bg="gray.50" borderRadius="lg">
          <Text fontSize="sm" color="gray.600" textAlign="center">
            <strong>New to the club?</strong>{" "}
            <Link to="/register" style={{color: '#2C7A7B'}}>
              Register here
            </Link>{" "}
            to create your account.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
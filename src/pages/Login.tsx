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
  InputGroup,
  InputRightElement,
  IconButton
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import type { LoginCredentials } from "../lib/authService";

export default function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    login_name: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credentials.login_name || !credentials.password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both username and password.",
        status: "warning",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(credentials);
      toast({
        title: "Login Successful!",
        description: "You are now logged in.",
        status: "success",
        duration: 5000,
      });
      // Redirect to home page after successful login
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Login Failed",
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
            Enter your credentials to sign in
          </Text>
        </Box>

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

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    placeholder="Enter your password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

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
              
              <Box w="full" textAlign="center">
                <Text fontSize="sm" color="gray.600">
                  <Link to="/forgot-password" style={{color: '#2C7A7B'}}>
                    Forgot your password?
                  </Link>
                </Text>
              </Box>
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
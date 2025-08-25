import { useState, useEffect } from "react";
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
  IconButton,
  Alert,
  AlertIcon,
  FormHelperText
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { AuthService } from "../lib/authService";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  // Check if passwords match when either password field changes
  const validatePasswords = (password: string, confirm: string) => {
    if (confirm && password !== confirm) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired.",
        status: "error",
        duration: 5000,
      });
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both password fields match.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({ token, newPassword: password });
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been reset. You can now log in with your new password.",
        status: "success",
        duration: 5000,
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
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
            Reset Password
          </Heading>
          <Text color="gray.600">
            Create a new password for your account
          </Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          {!tokenValid ? (
            <>
              <Alert status="error" borderRadius="md" mb={4}>
                <AlertIcon />
                The password reset link is invalid or has expired.
              </Alert>
              <Box mt={4} textAlign="center">
                <Text fontSize="sm" color="gray.600">
                  <Link to="/forgot-password" style={{color: '#2C7A7B'}}>
                    Request a new password reset
                  </Link>
                </Text>
              </Box>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setPassword(newPassword);
                        validatePasswords(newPassword, confirmPassword);
                      }}
                      placeholder="Create a new password"
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
                  <FormHelperText>Password must be at least 8 characters long</FormHelperText>
                </FormControl>

                <FormControl isRequired isInvalid={!passwordsMatch}>
                  <FormLabel>Confirm New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const newConfirmPassword = e.target.value;
                        setConfirmPassword(newConfirmPassword);
                        validatePasswords(password, newConfirmPassword);
                      }}
                      placeholder="Confirm your new password"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {!passwordsMatch && (
                    <FormHelperText color="red.500">
                      Passwords don't match
                    </FormHelperText>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  w="full"
                  isLoading={loading}
                  loadingText="Resetting..."
                >
                  Reset Password
                </Button>
                
                <Box mt={4} textAlign="center">
                  <Text fontSize="sm" color="gray.600">
                    <Link to="/login" style={{color: '#2C7A7B'}}>
                      Back to login
                    </Link>
                  </Text>
                </Box>
              </VStack>
            </form>
          )}
        </Box>
      </VStack>
    </Container>
  );
}

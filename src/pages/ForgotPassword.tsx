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
import { AuthService } from "../lib/authService";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [login_name, setLoginName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login_name) {
      toast({
        title: "Missing Username",
        description: "Please enter your username.",
        status: "warning",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      await AuthService.requestPasswordReset({ login_name });
      setSuccess(true);
      toast({
        title: "Password Reset Email Sent",
        description: "If your username exists in our system, you will receive an email with instructions to reset your password.",
        status: "success",
        duration: 8000,
      });
    } catch (error: any) {
      // Don't reveal if the username exists or not (security best practice)
      // Still show success UI to prevent username enumeration attacks
      console.error("Password reset error:", error);
      
      if (error.message.includes("Username not found")) {
        // If username doesn't exist, still show success UI but don't send email
        setSuccess(true);
        // No toast here to maintain consistent UX regardless of whether user exists
      } else {
        // For other errors, show a generic message
        toast({
          title: "Password Reset Failed",
          description: "There was a problem processing your request. Please try again later.",
          status: "error",
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Forgot Password
          </Heading>
          <Text color="gray.600">
            Enter your username to reset your password
          </Text>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          {success ? (
            <>
              <Alert status="success" borderRadius="md" mb={4}>
                <AlertIcon />
                Password reset link has been sent to your email address. Please check your inbox.
              </Alert>
              <Text fontSize="sm" mt={4} color="gray.600">
                If you don't receive the email within a few minutes, please check your spam folder.
              </Text>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Username</FormLabel>
                  <Input
                    value={login_name}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Enter your username"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  size="lg"
                  w="full"
                  isLoading={loading}
                  loadingText="Sending..."
                >
                  Send Reset Link
                </Button>
              </VStack>
            </form>
          )}
          
          <Box mt={4} textAlign="center">
            <Text fontSize="sm" color="gray.600">
              <Link to="/login" style={{color: '#2C7A7B'}}>
                Back to login
              </Link>
            </Text>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
}

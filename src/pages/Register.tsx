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
  IconButton,
  FormHelperText
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../lib/authService";
import type { RegisterData } from "../lib/authService";

export default function Register() {
  const [form, setForm] = useState<RegisterData>({
    full_name: "",
    email: "",
    phone: "",
    login_name: "",
    password: ""
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

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
    
    // Validate passwords match
    if (form.password !== confirmPassword) {
      setPasswordsMatch(false);
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields match.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    // Validate password strength
    if (form.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    
    try {
      await AuthService.register(form);
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now sign in.",
        status: "success",
        duration: 5000,
      });
      navigate('/login');
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
              
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={form.login_name}
                  onChange={(e) => setForm(prev => ({ ...prev, login_name: e.target.value }))}
                  placeholder="Choose a username for login"
                />
                <FormHelperText>This will be used to log in to your account</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setForm(prev => ({ ...prev, password: newPassword }));
                      validatePasswords(newPassword, confirmPassword);
                    }}
                    placeholder="Create a password"
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
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      const newConfirmPassword = e.target.value;
                      setConfirmPassword(newConfirmPassword);
                      validatePasswords(form.password, newConfirmPassword);
                    }}
                    placeholder="Confirm your password"
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
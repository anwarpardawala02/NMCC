import { Box, Container, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <Container maxW="container.md" py={12}>
      <VStack spacing={8} align="center" textAlign="center">
        <Icon as={WarningTwoIcon} w={16} h={16} color="red.500" />
        
        <Heading size="xl" color="red.500">
          Access Denied
        </Heading>
        
        <Box>
          <Text fontSize="lg" mb={4}>
            You don't have the necessary permissions to access this page.
          </Text>
          <Text fontSize="md" color="gray.600">
            This area is restricted to club administrators only. If you believe you should have access, 
            please contact a club administrator for assistance.
          </Text>
        </Box>
        
        <Button
          as={Link}
          to="/"
          size="lg"
          colorScheme="green"
        >
          Return to Home
        </Button>
      </VStack>
    </Container>
  );
}

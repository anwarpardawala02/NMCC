import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Image, 
  Text,
  Link,
  VStack,
  Container,
  Badge
} from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import { listSponsors } from "../lib/db";
import type { Sponsor } from "../lib/db";

const tierColors = {
  platinum: 'purple',
  gold: 'yellow',
  silver: 'gray',
  bronze: 'orange'
};

const tierOrder = ['platinum', 'gold', 'silver', 'bronze'];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const data = await listSponsors();
      // Sort by tier priority
      const sorted = data.sort((a, b) => 
        tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
      );
      setSponsors(sorted);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4} color="green.600">
            Our Sponsors
          </Heading>
          <Text color="gray.600" fontSize="lg">
            We're grateful for the support of our wonderful sponsors who help make our club possible
          </Text>
        </Box>

        {sponsors.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Heading size="md" color="gray.500" mb={2}>
              No sponsors listed yet
            </Heading>
            <Text color="gray.400">
              If you're interested in sponsoring our club, please get in touch!
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={[1, 2, 3, 4]} spacing={8}>
            {sponsors.map((sponsor) => (
              <Box 
                key={sponsor.id}
                p={6}
                borderWidth={2}
                borderRadius="lg"
                bg="white"
                textAlign="center"
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                borderColor={`${tierColors[sponsor.tier]}.200`}
              >
                <VStack spacing={4}>
                  <Badge 
                    colorScheme={tierColors[sponsor.tier]} 
                    size="lg"
                    textTransform="capitalize"
                  >
                    {sponsor.tier} Sponsor
                  </Badge>
                  
                  {sponsor.logo_url ? (
                    <Image 
                      src={sponsor.logo_url} 
                      alt={`${sponsor.name} logo`}
                      maxH="100px"
                      maxW="200px"
                      objectFit="contain"
                    />
                  ) : (
                    <Box 
                      h="100px" 
                      w="200px" 
                      bg="gray.100" 
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.500" fontSize="sm">No Logo</Text>
                    </Box>
                  )}
                  
                  <Heading size="md">{sponsor.name}</Heading>
                  
                  {sponsor.description && (
                    <Text color="gray.600" fontSize="sm" noOfLines={3}>
                      {sponsor.description}
                    </Text>
                  )}
                  
                  {sponsor.website_url && (
                    <Link 
                      href={sponsor.website_url} 
                      isExternal
                      color="green.600"
                      fontWeight="medium"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Visit Website <ExternalLink size={16} style={{ display: 'inline', marginLeft: '4px' }} />
                    </Link>
                  )}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}

        <Box p={6} bg="green.50" borderRadius="lg" textAlign="center">
          <Heading size="md" mb={2} color="green.800">
            Interested in Sponsoring Us?
          </Heading>
          <Text color="green.700">
            We offer various sponsorship packages to suit different budgets. 
            Contact us to learn more about how you can support Northolt Manor Cricket Club.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
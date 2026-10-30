import { useEffect, useState } from "react";
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Image, 
  Text,
  Link,
  VStack,
  Button,
  Badge
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
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
    <Box h="calc(100vh - 80px)" display="flex" flexDirection="column" overflow="hidden">
      <VStack spacing={12} align="center" justify="center" w="full" flex={1}>
        <Box textAlign="center" maxW="900px" w="full">
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
          <SimpleGrid columns={[1, 2, 3]} spacing={8} w="full" maxW="900px" placeItems="center" mx="auto" justifyItems="center">
            {sponsors.map((sponsor) => (
              <VStack
                key={sponsor.id}
                spacing={2}
                align="center"
                justify="center"
              >
                {sponsor.logo_url ? (
                  <Link 
                    href={sponsor.website_url || '#'}
                    isExternal={!!sponsor.website_url}
                    _hover={{ opacity: 0.8 }}
                    transition="opacity 0.2s"
                  >
                    <Image 
                      src={sponsor.logo_url} 
                      alt={`${sponsor.name} logo`}
                      maxH="100px"
                      maxW="180px"
                      objectFit="contain"
                    />
                  </Link>
                ) : (
                  <Box 
                    h="100px" 
                    w="180px" 
                    bg="gray.100" 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500" fontSize="sm" textAlign="center">{sponsor.name}</Text>
                  </Box>
                )}
              </VStack>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      <Box 
        p={8} 
        borderRadius="md" 
        textAlign="center" 
        maxW="500px" 
        mx="auto" 
        mt="auto" 
        w="full"
        bg="gray.50"
      >
        <Heading size="md" mb={4} color="gray.700" fontWeight="semibold">
          Interested in Sponsoring?
        </Heading>
        <Button 
          as="a" 
          href="mailto:northoltmanorcc@gmail.com"
          variant="outline"
          colorScheme="gray"
          size="md"
          _hover={{ 
            textDecoration: 'none',
            bg: 'gray.100'
          }}
        >
          Get in Touch
        </Button>
      </Box>
    </Box>
  );
}
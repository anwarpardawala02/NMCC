import { Box, Flex, Link, Button, Image, HStack, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, VStack, IconButton } from "@chakra-ui/react";
import { Routes, Route, Link as RouterLink, useNavigate } from "react-router-dom";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useAuth } from "../hooks/useAuth";

// Pages
import Home from "../pages/Home";
import Register from "../pages/Register";
import ClubMediaHub from "../pages/Gallery";
import BlogPost from "../pages/BlogPost";
import Sponsors from "../pages/Sponsors";
import Admin from "../pages/Admin";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Team from "../pages/Team";
import Unauthorized from "../pages/Unauthorized";
import FixtureAvailabilityPage from "../pages/FixtureAvailabilityPage";
import FixtureAvailabilityDetailPage from "../pages/FixtureAvailabilityDetailPage";
import ScoresheetUpload from "../pages/scoresheets/upload";

// Team subpages
import TeamSquad from "../pages/team/Squad";
import TeamMatches from "../pages/team/Matches";
import TeamStatistics from "../pages/team/Statistics";

export default function Layout() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Register', path: '/register' },
    { label: 'Squad Room', path: '/team' },
    { label: 'Club Media Hub', path: '/gallery' },
    { label: 'Sponsors', path: '/sponsors' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box bg="#f5f7fa" px={{ base: 2, md: 8 }} py={2}>
        <Flex align="center" justify="space-between">
          <HStack spacing={4}>
            <Box boxSize="64px" borderRadius="full" border="4px solid #1a3a5c" bg="white" display="flex" alignItems="center" justifyContent="center">
              <Image
                src="/Northolt_Manor_Cricket_Club_Logo_full__1_.png"
                alt="Northolt Manor Cricket Club Logo"
                boxSize="56px"
                borderRadius="full"
              />
            </Box>
            <Box fontSize="2xl" fontWeight="bold" color="#344563" letterSpacing="1px" textTransform="uppercase">
              Northolt Manor CC
            </Box>
          </HStack>
          {/* Right nav links */}
          <HStack spacing={0} display={{ base: 'none', md: 'flex' }} align="center">
            {navItems.map((item, idx) => (
              <HStack key={item.path} spacing={0} align="center">
                {idx !== 0 && <Box h="24px" borderLeft="2px solid #7ed957" mx={3} />}
                <Link as={RouterLink} to={item.path} color="#1a3a5c" fontWeight="bold" fontSize="md" _hover={{ color: '#7ed957' }}>
                  {item.label}
                </Link>
              </HStack>
            ))}
            {!isLoading && user?.is_admin && (
              <HStack spacing={0} align="center">
                <Box h="24px" borderLeft="2px solid #7ed957" mx={3} />
                <Link as={RouterLink} to="/admin" color="#1a3a5c" fontWeight="bold" fontSize="md" _hover={{ color: '#7ed957' }}>
                  Admin
                </Link>
              </HStack>
            )}
            <Box h="24px" borderLeft="2px solid #7ed957" mx={3} />
            {!isLoading && user ? (
              <HStack>
                <Box 
                  px={2}
                  py={1}
                  bg={user.is_admin ? "green.100" : "blue.50"} 
                  color={user.is_admin ? "green.800" : "blue.800"}
                  borderRadius="md" 
                  fontSize="xs" 
                  fontWeight="bold"
                >
                  {user.is_admin ? '👑 ADMIN' : '👤 MEMBER'}
                </Box>
                <Button size="sm" colorScheme="blue" variant="ghost" onClick={handleSignOut} fontWeight="bold">
                  Sign Out
                </Button>
              </HStack>
            ) : (
              <Button as={RouterLink} to="/login" size="sm" colorScheme="blue" variant="ghost" fontWeight="bold">
                Sign In
              </Button>
            )}
          </HStack>
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="outline"
            onClick={onOpen}
          />
        </Flex>
      </Box>
      {/* Thick blue bar */}
      <Box bg="#1a3a5c" h="10px" w="100%" />

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {!isLoading && user && (
                <Box 
                  p={3}
                  bg={user.is_admin ? "green.100" : "blue.50"} 
                  color={user.is_admin ? "green.800" : "blue.800"}
                  borderRadius="md"
                  mb={2}
                >
                  <Box fontWeight="bold">{user.is_admin ? 'Admin User' : 'Club Member'}</Box>
                  <Box fontSize="sm">{user.email}</Box>
                </Box>
              )}
              
              {navItems.map(item => (
                <Link key={item.path} as={RouterLink} to={item.path} onClick={onClose}>
                  {item.label}
                </Link>
              ))}
              {user?.is_admin && (
                <Link as={RouterLink} to="/admin" onClick={onClose} color="red.500" fontWeight="bold">
                  Admin Dashboard
                </Link>
              )}
              
              {user ? (
                <Button colorScheme="red" onClick={() => { handleSignOut(); onClose(); }}>
                  Sign Out
                </Button>
              ) : (
                <Button as={RouterLink} to="/login" colorScheme="green" onClick={onClose}>
                  Sign In
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Routes */}
      <Box minH="calc(100vh - 80px)">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />}>
            <Route path="/team/squad" element={<TeamSquad />} />
            <Route path="/team/matches" element={<TeamMatches />} />
            <Route path="/team/statistics" element={<TeamStatistics />} />
            <Route index element={<TeamSquad />} />
          </Route>
          <Route path="/register" element={<Register />} />
          <Route path="/gallery" element={<ClubMediaHub />} />
          <Route path="/gallery/blog" element={<ClubMediaHub />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/fixtures/:fixtureId/availability" element={<FixtureAvailabilityPage />} />
          <Route path="/matches/availability/:fixtureId" element={<FixtureAvailabilityPage />} />
          <Route path="/fixtures/:fixtureId/availability-detail" element={<FixtureAvailabilityDetailPage />} />
          <Route path="/scoresheets/upload" element={<ScoresheetUpload />} />
        </Routes>
      </Box>

      {/* Footer */}
      <Box bg="gray.800" color="white" p={6} textAlign="center">
        <Box mb={4}>© 2025 Northolt Manor Cricket Club. All rights reserved.</Box>
        
        {/* Social Media Icons */}
        <Flex justifyContent="center" mb={4}>
          <Link href="https://www.instagram.com/northoltmanor/" isExternal mx={2}>
            <Box 
              as="span" 
              bg="white" 
              color="#E1306C" 
              p={2} 
              borderRadius="full" 
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="40px"
              height="40px"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </Box>
          </Link>
          
          <Link href="https://www.tiktok.com/@northolt.manor.cr" isExternal mx={2}>
            <Box 
              as="span" 
              bg="black" 
              color="white" 
              p={2} 
              borderRadius="full" 
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="40px"
              height="40px"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </Box>
          </Link>
        </Flex>
        
        <Box fontSize="sm" color="gray.400">
          Established 1925 • Serving the community for nearly a century
        </Box>
      </Box>
    </Box>
  );
}
import { Box, Flex, Link, Button, Image, HStack, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, VStack, IconButton } from "@chakra-ui/react";
import { Routes, Route, Link as RouterLink, useNavigate } from "react-router-dom";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useAuth } from "../hooks/useAuth";

// Pages
import Home from "../pages/Home";
import Register from "../pages/Register";
import Gallery from "../pages/Gallery";
import Blog from "../pages/Blog";
import BlogPost from "../pages/BlogPost";
import Sponsors from "../pages/Sponsors";
import Admin from "../pages/Admin";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Team from "../pages/Team";
import Unauthorized from "../pages/Unauthorized";

// Team subpages
import TeamSquad from "../pages/team/Squad";
import TeamMatches from "../pages/team/Matches";
import TeamStatistics from "../pages/team/Statistics";

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Team', path: '/team' },
    { label: 'Register', path: '/register' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
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
            {user?.is_admin && (
              <HStack spacing={0} align="center">
                <Box h="24px" borderLeft="2px solid #7ed957" mx={3} />
                <Link as={RouterLink} to="/admin" color="#1a3a5c" fontWeight="bold" fontSize="md" _hover={{ color: '#7ed957' }}>
                  Admin
                </Link>
              </HStack>
            )}
            <Box h="24px" borderLeft="2px solid #7ed957" mx={3} />
            {user ? (
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
              {user && (
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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Box>

      {/* Footer */}
      <Box bg="gray.800" color="white" p={6} textAlign="center">
        <Box mb={2}>© 2025 Northolt Manor Cricket Club. All rights reserved.</Box>
        <Box fontSize="sm" color="gray.400">
          Established 1925 • Serving the community for nearly a century
        </Box>
      </Box>
    </Box>
  );
}
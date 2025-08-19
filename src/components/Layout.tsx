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
import Matches from "../pages/Matches";
import Statistics from "../pages/Statistics";
import Admin from "../pages/Admin";
import Login from "../pages/Login";

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
    { label: 'Register', path: '/register' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
    { label: 'Sponsors', path: '/sponsors' },
    { label: 'Matches', path: '/matches' },
    { label: 'Statistics', path: '/statistics' },
  ];

  return (
    <Box>
      {/* Navbar */}
      <Flex as="nav" p={4} bg="green.600" color="white" justify="space-between" align="center">
        <HStack spacing={4}>
          <Image 
            src="https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop" 
            alt="Northolt Manor CC Logo" 
            boxSize="40px" 
            borderRadius="full"
          />
          <Box fontSize="xl" fontWeight="bold">Northolt Manor CC</Box>
        </HStack>

        {/* Desktop Navigation */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          {navItems.map(item => (
            <Link key={item.path} as={RouterLink} to={item.path} _hover={{ textDecoration: 'underline' }}>
              {item.label}
            </Link>
          ))}
          {user?.is_admin && (
            <Link as={RouterLink} to="/admin" _hover={{ textDecoration: 'underline' }}>
              Admin
            </Link>
          )}
        </HStack>

        <HStack spacing={2}>
          {user ? (
            <>
              <Box fontSize="sm">Welcome, {user.full_name || user.email}</Box>
              <Button size="sm" colorScheme="green" variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button as={RouterLink} to="/login" size="sm" colorScheme="green" variant="outline">
              Login
            </Button>
          )}
          
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="outline"
            onClick={onOpen}
          />
        </HStack>
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Navigation</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {navItems.map(item => (
                <Link key={item.path} as={RouterLink} to={item.path} onClick={onClose}>
                  {item.label}
                </Link>
              ))}
              {user?.is_admin && (
                <Link as={RouterLink} to="/admin" onClick={onClose}>
                  Admin
                </Link>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Routes */}
      <Box minH="calc(100vh - 80px)">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/login" element={<Login />} />
          {user?.is_admin && <Route path="/admin" element={<Admin />} />}
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
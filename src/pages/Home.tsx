import { useEffect, useState } from "react";
import { Box, Heading, SimpleGrid, Image } from "@chakra-ui/react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [photos, setPhotos] = useState<{ id: string; url: string; title?: string }[]>([]);

  useEffect(() => {
    async function fetchPhotos() {
      const { data, error } = await supabase.from("photos").select("*").order("uploaded_at", { ascending: false });
      if (error) console.error(error);
      else setPhotos(data);
    }
    fetchPhotos();
  }, []);

  return (
    <Box p={6}>
      <Heading mb={4}>Club Photo Gallery</Heading>
      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {photos.map((p) => (
          <Image key={p.id} src={p.url} alt={p.title} borderRadius="md" />
        ))}
      </SimpleGrid>
    </Box>
  );
}

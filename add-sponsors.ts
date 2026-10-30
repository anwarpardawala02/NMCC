import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSponsors() {
  const sponsors = [
    {
      name: 'Printwell',
      tier: 'gold',
      active: true,
      description: 'Professional printing services',
      logo_url: '/medium_Printwell_Logo.png'
    },
    {
      name: 'Saifee Solicitors',
      tier: 'gold',
      active: true,
      description: 'Legal services and consulting',
      logo_url: '/medium_Saifee_Silictors_Logo.png'
    },
    {
      name: 'Who is Hussain',
      tier: 'gold',
      active: true,
      description: 'Community organization',
      website_url: 'https://whoishussain.org',
      logo_url: '/medium_Who_is_Hussain_-_Logo_-_Colour.png'
    }
  ];

  try {
    for (const sponsor of sponsors) {
      const { data, error } = await supabase
        .from('sponsors')
        .insert([sponsor])
        .select();

      if (error) {
        console.error(`Error adding ${sponsor.name}:`, error);
      } else {
        console.log(`✓ Added ${sponsor.name}`, data);
      }
    }
    console.log('\nAll sponsors added successfully!');
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

addSponsors();

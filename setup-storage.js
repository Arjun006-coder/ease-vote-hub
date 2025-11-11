/**
 * Setup script to create Supabase Storage bucket for ID cards
 * Run this script once to create the 'id-cards' storage bucket
 * 
 * Usage: node setup-storage.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set in .env.local');
  console.error('\nIf you don\'t have a service role key:');
  console.error('1. Go to your Supabase project dashboard');
  console.error('2. Navigate to Settings > API');
  console.error('3. Copy the "service_role" key (keep it secret!)');
  console.error('4. Add it to .env.local as SUPABASE_SERVICE_KEY=your_key_here');
  process.exit(1);
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBucket() {
  console.log('🚀 Setting up Supabase Storage bucket...\n');

  const bucketName = 'id-cards';
  const isPublic = false; // Private bucket - files are accessible via signed URLs or RLS policies

  try {
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      throw listError;
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`);
      
      // Update bucket configuration
      const { data, error } = await supabase.storage.updateBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      });

      if (error) {
        console.error('⚠️  Warning: Could not update bucket configuration:', error.message);
      } else {
        console.log(`✅ Bucket '${bucketName}' configuration updated`);
      }
      
      return;
    }

    // Create the bucket
    console.log(`📦 Creating bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 10485760, // 10MB in bytes
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    });

    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      throw error;
    }

    console.log(`✅ Bucket '${bucketName}' created successfully!`);
    console.log(`   - Public: ${isPublic ? 'Yes' : 'No (private)'}`);
    console.log(`   - Max file size: 10MB`);
    console.log(`   - Allowed types: images (JPEG, PNG, JPG, WebP)`);
    
    // Set up storage policies (RLS)
    console.log('\n📋 Note: You may need to set up storage policies manually in Supabase:');
    console.log('   1. Go to Storage > Policies in your Supabase dashboard');
    console.log('   2. Create policies for the "id-cards" bucket');
    console.log('   3. Allow authenticated users to upload files');
    console.log('   4. Allow users to read their own files');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n📖 Manual setup instructions:');
    console.error('   1. Go to your Supabase project dashboard');
    console.error('   2. Navigate to Storage');
    console.error('   3. Click "New bucket"');
    console.error('   4. Name: id-cards');
    console.error('   5. Public: No (private)');
    console.error('   6. File size limit: 10MB');
    console.error('   7. Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp');
    console.error('   8. Click "Create bucket"');
    process.exit(1);
  }
}

// Run setup
setupStorageBucket()
  .then(() => {
    console.log('\n✅ Storage setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });


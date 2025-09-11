// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_CONFIG = {
	url: 'https://wqowyfrchxpmaawyjyzd.supabase.co', // e.g., 'https://your-project.supabase.co'
	anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxb3d5ZnJjaHhwbWFhd3lqeXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDg3NzMsImV4cCI6MjA3MzE4NDc3M30.MRPudROEfsHVQJA4K57JNYBgtMSQj3cGHa0l-uvEI7U' // Your public anon key
};

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Export for use in other files
window.supabaseClient = supabase;

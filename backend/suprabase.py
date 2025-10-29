# backend/supabase.py
from supabase import create_client, Client

url = https://nxrszkxayqgoyxohngfz.supabase.co
key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cnN6a3hheXFnb3l4b2huZ2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc0NzUzNywiZXhwIjoyMDc3MzIzNTM3fQ.9WJGzR2N0PwVD9m7TeRNGhPuVDLR_zacuQNMHaZY-Fk  # from Supabase dashboard

supabase: Client = create_client(url, key)
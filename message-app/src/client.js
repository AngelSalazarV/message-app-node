import { io } from "socket.io-client";
import { createClient } from "@supabase/supabase-js";

// Configuración de Socket.IO
const socket = io(import.meta.env.VITE_SERVER_URL);

// Configuración de Supabase
const supabaseUrl = "https://kiinqpxnutbuauziwbbu.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaW5xcHhudXRidWF1eml3YmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTMxMTAsImV4cCI6MjA1NjA2OTExMH0.MdYSZzhTPRafSOUeZ_qxKpizVPT0rEU9f0c2vSJ5-zo";
const supabase = createClient(supabaseUrl, supabaseKey);

// Exportar `socket` como default y `supabase` como exportación con nombre
export default socket;
export { supabase };
export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-gray-300 ">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
      
        <div className="text-sm font-medium">
         Mahmoud Emad
        </div>

        
        <div className="text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Linked Posts App. All rights reserved.
        </div>

    

      </div>
    </footer>
  );
}

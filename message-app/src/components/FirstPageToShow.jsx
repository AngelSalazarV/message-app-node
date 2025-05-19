
export function FirstPageToShow() {
  return (
    <section className="flex flex-col items-center justify-center w-full h-screen bg-amber-50">
      <div className="flex flex-col items-center justify-center">
        <h1>Welcome to the message app!</h1>
        <p>Here you can send messages to your friends.</p>
      </div>
      <div className="absolute bottom-4 text-gray-500">
        <p>Version 1.0.0</p>
      </div>
    </section>
  );
} 
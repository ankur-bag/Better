import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp 
        routing="path" 
        path="/sign-up" 
        fallbackRedirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </div>
  );
}

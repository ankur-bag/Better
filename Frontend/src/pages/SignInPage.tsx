import { SignIn } from "@clerk/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignIn 
        routing="path" 
        path="/sign-in" 
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/lib/validators";
import { adminLogin } from "@/actions/admin";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider"; // Import auth hook

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { admin } = useAuth(); // Use the auth hook
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });

  // Redirect if already logged in
  useEffect(() => {
    if (admin) {
      router.push("/admin/dashboard");
    }
  }, [admin, router]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const result = await adminLogin(data);
      
      if (result.token) {
        // Store token in localStorage
        localStorage.setItem("adminToken", result.token);
        
        toast.success(`Welcome back, ${result.username}!`);
        
        // Use router.push instead of redirect
        router.push("/admin/dashboard");
      } else {
        setErrorMessage("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* You can replace with your actual logo */}
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <LockKeyhole className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to access dashboard</p>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className={cn(
                      "pl-10 py-5 bg-gray-50 border border-gray-200",
                      errors.username && "border-red-500 focus-visible:ring-red-500"
                    )}
                    {...register("username")}
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.username?.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockKeyhole className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    className={cn(
                      "pl-10 py-5 pr-10 bg-gray-50 border border-gray-200",
                      errors.password && "border-red-500 focus-visible:ring-red-500"
                    )}
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <div 
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password?.message}
                  </p>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full py-5 text-base font-medium transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Kauthuk. All rights reserved.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
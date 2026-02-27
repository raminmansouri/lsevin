import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { mockProfessionals, mockServices, mockSchedules } from "../data/mockData";
import { ArrowLeft, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "../components/ui/switch";
import { useRequireAdmin } from "../hooks/useRequireAdmin";

export default function Admin() {
  const navigate = useNavigate();
  const { loading, authorized } = useRequireAdmin();
  const [professionals, setProfessionals] = useState(mockProfessionals);
  const [services, setServices] = useState(mockServices);
  const [schedules, setSchedules] = useState(mockSchedules);
  const [showAddProfessional, setShowAddProfessional] = useState(false);
  const [showAddService, setShowAddService] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Checking admin permissions...</div>
      </div>
    );
  }

  if (!authorized) {
    // Redirect is handled inside useRequireAdmin; render nothing here.
    return null;
  }

  const handleAddProfessional = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProfessional = {
      id: String(professionals.length + 1),
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop`,
    };
    setProfessionals([...professionals, newProfessional]);
    setShowAddProfessional(false);
    toast.success("Professional added successfully");
  };

  const handleDeleteProfessional = (id: string) => {
    setProfessionals(professionals.filter((p) => p.id !== id));
    toast.success("Professional removed");
  };

  const handleAddService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newService = {
      id: String(services.length + 1),
      name: formData.get("name") as string,
      duration: Number(formData.get("duration")),
      price: Number(formData.get("price")),
      category: formData.get("category") as string,
      requiresMultipleDays: formData.get("multiDay") === "on",
      numberOfDays: formData.get("multiDay") === "on" ? Number(formData.get("numberOfDays")) : undefined,
    };
    setServices([...services, newService]);
    setShowAddService(false);
    toast.success("Service added successfully");
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    toast.success("Service removed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Admin Panel</h1>
                <p className="text-sm text-gray-600">
                  Manage professionals, services, and schedules
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="professionals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="professionals">Professionals</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* Professionals Tab */}
          <TabsContent value="professionals" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Professionals</h2>
                <Dialog open={showAddProfessional} onOpenChange={setShowAddProfessional}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Professional
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Professional</DialogTitle>
                      <DialogDescription>
                        Add a new professional to your team
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddProfessional} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role/Title</Label>
                        <Input id="role" name="role" required />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Professional
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professional</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((prof) => (
                    <TableRow key={prof.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={prof.avatar} alt={prof.name} />
                            <AvatarFallback>{prof.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{prof.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{prof.role}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProfessional(prof.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Services</h2>
                <Dialog open={showAddService} onOpenChange={setShowAddService}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Service</DialogTitle>
                      <DialogDescription>
                        Create a new service offering
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-name">Service Name</Label>
                        <Input id="service-name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            name="duration"
                            type="number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price ($)</Label>
                          <Input id="price" name="price" type="number" required />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="multiDay" name="multiDay" />
                        <Label htmlFor="multiDay">Multi-day service</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numberOfDays">Number of Days (if multi-day)</Label>
                        <Input
                          id="numberOfDays"
                          name="numberOfDays"
                          type="number"
                          defaultValue="1"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Add Service
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.requiresMultipleDays && (
                            <span className="text-xs text-blue-600">
                              Multi-day ({service.numberOfDays} days)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.category}</TableCell>
                      <TableCell>{service.duration} min</TableCell>
                      <TableCell>${service.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Professional Schedules</h2>
              </div>

              <div className="space-y-6">
                {professionals.map((prof) => {
                  const schedule = schedules.find(
                    (s) => s.professionalId === prof.id
                  );
                  return (
                    <Card key={prof.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={prof.avatar} alt={prof.name} />
                            <AvatarFallback>{prof.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{prof.name}</div>
                            <div className="text-sm text-gray-600">{prof.role}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Edit Schedule
                        </Button>
                      </div>

                      {schedule && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Working Hours</div>
                            <div className="font-medium">
                              {schedule.workingHours.start} -{" "}
                              {schedule.workingHours.end}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Available Days</div>
                            <div className="font-medium">
                              {schedule.availableDates.length} days scheduled
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

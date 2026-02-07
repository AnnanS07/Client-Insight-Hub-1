import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, Client, Note } from "@/lib/mock-data";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export default function ClientDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: client, isLoading } = useQuery({ 
    queryKey: ['client', id], 
    queryFn: () => mockDb.getClient(id) 
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => mockDb.getNotes(id)
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      mockDb.addNote({
        clientId: id,
        content: newNote,
        createdBy: user?.name || "Unknown"
      });
      // Also update last contact
      mockDb.updateClient(id, { lastContact: new Date().toISOString() });
    },
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast({ title: "Note Added", description: "Client timeline updated." });
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading client details...</div>;
  if (!client) return <div className="p-8 text-center">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">{client.company}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Contact Info</CardTitle>
                <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Owner</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{client.owner.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground capitalize">{client.owner}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Contact</p>
                <p className="text-sm text-muted-foreground">{format(new Date(client.lastContact), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client.tags.length > 0 ? (
                  client.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags assigned</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity & Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>{user?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea 
                        placeholder="Log a call, meeting, or note..." 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => addNoteMutation.mutate()} 
                          disabled={!newNote.trim() || addNoteMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Post Note
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{note.createdBy.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm capitalize">{note.createdBy}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs">Client Created on {format(new Date(client.createdAt), "PPP")}</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Task management for this client coming soon. Use the main Tasks page for now.
                </CardContent>
              </Card>
            </TabsContent>
            
             <TabsContent value="files" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  File attachments feature coming soon.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Trash2, Edit2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

interface RecipeCommentsProps {
  recipeId: string;
}

const RecipeComments = ({ recipeId }: RecipeCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("recipe_comments")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails for display
      const commentsWithEmails = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", comment.user_id)
            .single();
          return { ...comment, user_email: profile?.email };
        })
      );

      setComments(commentsWithEmails);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte schreibe einen Kommentar.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("recipe_comments")
        .insert({
          recipe_id: recipeId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setComments([{ ...data, user_email: user.email }, ...comments]);
      setNewComment("");
      toast({
        title: "Kommentar hinzugefügt!",
        description: "Dein Kommentar wurde veröffentlicht."
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("recipe_comments")
        .update({ content: editContent.trim() })
        .eq("id", id);

      if (error) throw error;

      setComments(comments.map(c => 
        c.id === id ? { ...c, content: editContent.trim() } : c
      ));
      setEditingId(null);
      setEditContent("");
      toast({ title: "Kommentar aktualisiert!" });
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("recipe_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== id));
      toast({ title: "Kommentar gelöscht" });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  if (loading) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/4" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-lg border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Kommentare ({comments.length})</h3>
      </div>

      {/* Add Comment */}
      {user ? (
        <div className="flex gap-2 mb-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Schreibe einen Kommentar..."
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={addComment}
            disabled={submitting || !newComment.trim()}
            size="icon"
            className="gradient-neon text-primary-foreground shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          Melde dich an, um zu kommentieren.
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Noch keine Kommentare. Sei der Erste!
            </p>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 p-3 rounded-lg bg-muted/30"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {comment.user_email?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {comment.user_email?.split("@")[0] || "Nutzer"}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(comment.created_at), "dd.MM.yy", { locale: de })}
                    </span>
                  </div>
                  
                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateComment(comment.id)}>
                          <Check className="h-3 w-3 mr-1" />
                          Speichern
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        {comment.content}
                      </p>
                      
                      {user?.id === comment.user_id && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => startEdit(comment)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Löschen
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default RecipeComments;

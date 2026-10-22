"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, UserPlus, Trash2, Shield, Crown } from "lucide-react";
import Link from "next/link";

interface Membro {
  id: string;
  papel: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Owner {
  id: string;
  name: string;
  email: string;
}

const papelLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  visualizador: "Visualizador",
};

const papelColors: Record<string, string> = {
  admin: "bg-brand-accent/20 text-brand-accent border-brand-accent/30",
  editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  visualizador: "bg-brand-muted/20 text-brand-muted border-brand-muted/30",
};

export default function MembrosPage() {
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePapel, setInvitePapel] = useState("visualizador");
  const [inviting, setInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Remove dialog
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingName, setRemovingName] = useState("");

  async function fetchMembros() {
    try {
      const res = await fetch("/api/propriedade/membros");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao carregar membros");
        return;
      }
      const data = await res.json();
      setOwner(data.owner);
      setMembros(data.membros);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembros();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) {
      setError("Informe o email do usuário.");
      return;
    }
    setError("");
    setSuccess("");
    setInviting(true);

    try {
      const res = await fetch("/api/propriedade/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, papel: invitePapel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao convidar membro.");
        return;
      }

      setMembros((prev) => [...prev, data.membro]);
      setInviteEmail("");
      setInvitePapel("visualizador");
      setInviteDialogOpen(false);
      setSuccess("Membro adicionado com sucesso!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async () => {
    if (!removingId) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/propriedade/membros?id=${removingId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao remover membro.");
        return;
      }

      setMembros((prev) => prev.filter((m) => m.id !== removingId));
      setRemoveDialogOpen(false);
      setRemovingId(null);
      setRemovingName("");
      setSuccess("Membro removido com sucesso!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
  };

  const handleChangePapel = async (membroId: string, novoPapel: string) => {
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/propriedade/membros", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: membroId, papel: novoPapel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao atualizar papel.");
        return;
      }

      setMembros((prev) =>
        prev.map((m) => (m.id === membroId ? { ...m, papel: novoPapel } : m))
      );
      setSuccess("Papel atualizado com sucesso!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-brand-muted text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/propriedade">
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-muted hover:text-brand-text hover:bg-brand-alt"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display text-brand-text">
              Membros da Propriedade
            </h1>
            <p className="text-sm text-brand-muted mt-0.5">
              Gerencie quem tem acesso a sua propriedade
            </p>
          </div>
        </div>

        {/* Invite Button */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium">
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-brand-surface border-brand-border">
            <DialogHeader>
              <DialogTitle className="text-brand-text">
                Convidar Membro
              </DialogTitle>
              <DialogDescription className="text-brand-muted">
                Adicione um usuário pelo email para acessar sua propriedade.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm text-brand-text">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-brand-text">Papel</label>
                <Select value={invitePapel} onValueChange={setInvitePapel}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setInviteDialogOpen(false)}
                className="text-brand-muted hover:text-brand-text hover:bg-brand-alt"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={inviting}
                className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
              >
                {inviting ? "Convidando..." : "Convidar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Owner */}
      {owner && (
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-brand-text text-base">
              Proprietario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-gold/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-brand-gold" />
                </div>
                <div>
                  <p className="text-brand-text font-medium">
                    {owner.name || "Sem nome"}
                  </p>
                  <p className="text-brand-muted text-sm">{owner.email}</p>
                </div>
              </div>
              <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30">
                Proprietario
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-text text-base">
            Membros ({membros.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membros.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 text-brand-muted/50 mx-auto mb-3" />
              <p className="text-brand-muted text-sm">
                Nenhum membro adicionado ainda.
              </p>
              <p className="text-brand-muted/70 text-xs mt-1">
                Convide membros para compartilhar o acesso a sua propriedade.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {membros.map((membro) => (
                <div
                  key={membro.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-brand-alt border border-brand-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-accent/10 flex items-center justify-center">
                      <span className="text-brand-accent text-sm font-semibold">
                        {(membro.user.name || membro.user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-brand-text font-medium text-sm">
                        {membro.user.name || "Sem nome"}
                      </p>
                      <p className="text-brand-muted text-xs">
                        {membro.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={membro.papel}
                      onValueChange={(value) =>
                        handleChangePapel(membro.id, value)
                      }
                    >
                      <SelectTrigger className="w-[150px] bg-brand-alt border-brand-border text-brand-text text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-surface border-brand-border">
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="visualizador">
                          Visualizador
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Badge
                      className={`${papelColors[membro.papel]} text-xs hidden sm:inline-flex`}
                    >
                      {papelLabels[membro.papel]}
                    </Badge>

                    {/* Remove button with confirmation dialog */}
                    <Dialog
                      open={removeDialogOpen && removingId === membro.id}
                      onOpenChange={(open) => {
                        setRemoveDialogOpen(open);
                        if (!open) {
                          setRemovingId(null);
                          setRemovingName("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                          onClick={() => {
                            setRemovingId(membro.id);
                            setRemovingName(
                              membro.user.name || membro.user.email
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-brand-surface border-brand-border">
                        <DialogHeader>
                          <DialogTitle className="text-brand-text">
                            Remover Membro
                          </DialogTitle>
                          <DialogDescription className="text-brand-muted">
                            Tem certeza que deseja remover{" "}
                            <span className="text-brand-text font-medium">
                              {removingName}
                            </span>{" "}
                            da sua propriedade?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="ghost"
                            onClick={() => setRemoveDialogOpen(false)}
                            className="text-brand-muted hover:text-brand-text hover:bg-brand-alt"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleRemove}
                            className="bg-red-500 text-white hover:bg-red-600 font-medium"
                          >
                            Remover
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

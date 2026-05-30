"use client"

import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createNoticeSchema, type CreateNoticeFormValues, type CreateNoticeInput } from "@/modules/cms/validators"
import { useCreateNotice } from "@/modules/cms/hooks/use-notices"
import { PageHeader } from "@/components/enterprise/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateNoticePage() {
  const router = useRouter()
  const createMutation = useCreateNotice()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateNoticeFormValues>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      title: "",
      content: "",
      audience: { type: "ALL_DRIVERS" },
      requiresAck: false,
    },
  })

  const audienceType = watch("audience.type")

  async function onSubmit(data: CreateNoticeFormValues) {
    createMutation.mutate(data as unknown as Record<string, unknown>, {
      onSuccess: () => router.push("/admin/cms"),
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Create Notice" description="Compose and target a new fleet notice">
        <Link href="/admin/cms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., New vehicle maintenance schedule"
                {...register("title")}
              />
              {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <textarea
                id="content"
                rows={8}
                placeholder="Write your notice content here..."
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                {...register("content")}
              />
              {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-sm font-medium">Target Audience</h3>

            <div className="flex gap-3 flex-wrap">
              {(["ALL_DRIVERS", "DEPOT", "ROLE"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm cursor-pointer transition-colors ${
                    audienceType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    value={type}
                    className="sr-only"
                    checked={audienceType === type}
                    onChange={() => setValue("audience", { type } as CreateNoticeInput["audience"])}
                  />
                  {type === "ALL_DRIVERS" ? "All Drivers" : type === "DEPOT" ? "Specific Depot" : "Specific Role"}
                </label>
              ))}
            </div>

            {audienceType === "DEPOT" && (
              <div className="space-y-1">
                <Label>Select Depots</Label>
                <p className="text-xs text-muted-foreground">
                  Depot selection will be dynamic in production. Enter depot IDs for now.
                </p>
                <Input
                  placeholder="Comma-separated depot IDs (demo)"
                  onChange={(e) => {
                    const ids = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    setValue("audience", { type: "DEPOT", depotIds: ids.length > 0 ? ids : ["demo-depot-id"] } as CreateNoticeInput["audience"])
                  }}
                />
              </div>
            )}

            {audienceType === "ROLE" && (
              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <select
                  id="role"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  onChange={(e) =>
                    setValue("audience", { type: "ROLE", role: e.target.value } as CreateNoticeInput["audience"])
                  }
                >
                  <option value="driver">Driver</option>
                  <option value="conductor">Conductor</option>
                  <option value="depot_manager">Depot Manager</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresAck"
                className="size-4 rounded border-input"
                {...register("requiresAck")}
              />
              <div>
                <Label htmlFor="requiresAck">Requires Acknowledgement</Label>
                <p className="text-xs text-muted-foreground">
                  Drivers must explicitly acknowledge this notice
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/cms">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Create Notice
          </Button>
        </div>
      </form>
    </div>
  )
}

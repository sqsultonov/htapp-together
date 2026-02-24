import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image } from "lucide-react";
import { RegularTests } from "@/components/tests/RegularTests";
import { GraphicTestPlayer } from "@/components/graphic-tests/GraphicTestPlayer";

export default function Tests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Testlar</h1>
        <p className="text-muted-foreground">
          An'anaviy va grafik testlarni topshiring
        </p>
      </div>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="regular" className="gap-2">
            <FileText className="w-4 h-4" />
            An'anaviy testlar
          </TabsTrigger>
          <TabsTrigger value="graphic" className="gap-2">
            <Image className="w-4 h-4" />
            Grafik testlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="mt-6">
          <RegularTests />
        </TabsContent>

        <TabsContent value="graphic" className="mt-6">
          <GraphicTestPlayer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

namespace BitShuva.Chavah {
    export class StructuredLog implements Server.StructuredLog {
        id: string;
        messageTemplate: string;
        occurrenceCount: number;
        level: LogLevel;
        firstOccurrence: string;
        lastOccurrence: string;
        occurrences: Server.Log[];

        activeOccurrenceIndex = 0;
        activeCategory: "Message" | "Exception" | "Occurrences" = "Message";
        isExpanded = false;

        constructor(serverObj: Server.StructuredLog) {
            angular.merge(this, serverObj);
        }
    }
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	CancellationToken,
	Diagnostic,
	DiagnosticSeverity,
	DocumentDiagnosticParams,
	DocumentDiagnosticRequest,
	InitializeParams,
	InitializeResult,
	LSPErrorCodes,
	ProposedFeatures,
	ResponseError,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node'

import {
	TextDocument
} from 'vscode-languageserver-textdocument'

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

connection.onInitialize((_params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
		}
	}
	return result
})

connection.onInitialized(async () => {
	connection.onRequest(DocumentDiagnosticRequest.type, (params, token) => onDocumentDiagnostic(params, token))
	await connection.client.register(DocumentDiagnosticRequest.type, {
		documentSelector: null,
		interFileDependencies: false,
		workspaceDiagnostics: false,
	})
})

async function onDocumentDiagnostic(params: DocumentDiagnosticParams, token: CancellationToken): Promise<DocumentDiagnosticReport | ResponseError | undefined> {
	// Wait for some time and check if request is cancelled.
	await new Promise(r => setTimeout(r, 500))
	if (token.isCancellationRequested) {
		return new ResponseError(LSPErrorCodes.RequestCancelled, 'Cancelled')
	}

	const textDocument = documents.get(params.textDocument.uri)
	if (!textDocument)
		return

	const text = textDocument.getText()
	const pattern = /\w+/g
	let m: RegExpExecArray | null

	let problems = 0
	const diagnostics: Diagnostic[] = []
	while ((m = pattern.exec(text))) {
		problems++
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `Error ${problems}.`,
			source: 'ex'
		}
		diagnostics.push(diagnostic)
	}
	return { kind: 'full', items: diagnostics }
}

documents.listen(connection)
connection.listen()

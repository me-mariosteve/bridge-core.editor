import { FileWrapper } from '../FileView/FileWrapper'
import { CopyAction } from './Actions/Copy'
import { DeleteAction } from './Actions/Delete'
import { PasteAction } from './Actions/Paste'
import { RenameAction } from './Actions/Rename'
import { RevealFilePathAction } from './Actions/RevealFilePath'
import { App } from '/@/App'
import { showContextMenu } from '/@/components/ContextMenu/showContextMenu'
import { shareFile } from '/@/components/StartParams/Action/openRawFile'
import { InformationWindow } from '/@/components/Windows/Common/Information/InformationWindow'

export async function showFileContextMenu(
	event: MouseEvent,
	fileWrapper: FileWrapper
) {
	const mutatingActions = <const>[
		CopyAction(fileWrapper),
		PasteAction(fileWrapper.getParent()!),
		RenameAction(fileWrapper),
		DeleteAction(fileWrapper),

		// {
		// 	icon: 'mdi-pencil-outline',
		// 	name: 'windows.packExplorer.fileActions.rename.name',
		// 	onTrigger: () => {
		// 		directoryWrapper.startRename()
		// 	},
		// },
	]

	showContextMenu(event, [
		...(fileWrapper.options.isReadOnly
			? [CopyAction(fileWrapper)]
			: mutatingActions),
		{ type: 'divider' },
		{
			icon: 'mdi-share',
			name: 'general.shareFile',
			onTrigger: async () => {
				await shareFile(fileWrapper.handle)
			},
		},
		RevealFilePathAction(fileWrapper),
		{
			icon: 'mdi-cogs',
			name: 'windows.packExplorer.fileActions.viewCompilerOutput.name',
			description:
				'windows.packExplorer.fileActions.viewCompilerOutput.description',
			onTrigger: async () => {
				const app = await App.getApp()
				const project = app.project
				if (!fileWrapper.path) return

				const transformedPath = await project.compilerService.getCompilerOutputPath(
					fileWrapper.path
				)
				const fileSystem = app.comMojang.hasComMojang
					? app.comMojang.fileSystem
					: app.fileSystem

				// Information when file does not exist
				if (
					!transformedPath ||
					!(await fileSystem.fileExists(transformedPath))
				) {
					new InformationWindow({
						description:
							'windows.packExplorer.fileActions.viewCompilerOutput.fileMissing',
					})
					return
				}

				const fileHandle = await fileSystem.getFileHandle(
					transformedPath
				)
				await project?.openFile(fileHandle, {
					selectTab: true,
					isReadOnly: true,
				})
			},
		},
		// { type: 'divider' },
		// 	{
		// 		icon: 'mdi-file-search-outline',
		// 		name: 'Find in Folder',
		// 		onTrigger: async () => {},
		// 	},

		...(fileWrapper.options.provideFileContextMenu?.(fileWrapper) ?? []),
	])
}

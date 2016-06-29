import wrapConnectorHooks from './wrapConnectorHooks';
import areOptionsEqual from './areOptionsEqual';

export default function createSourceConnector(backend) {
  let currentHandlerId;

  let currentDragSourceNode;
  let currentDragSourceOptions;
  let disconnectCurrentDragSource;

  let currentDragPreviewNode;
  let currentDragPreviewOptions;
  let disconnectCurrentDragPreview;

  function log(msg, data) {
    const id = data && (data.id2 || data.id)  || currentHandlerId;

    console.debug('dnd: ' + msg + (id ? ' [' + id + ']' : ''), Object.assign({
      id,
      source: currentDragSourceNode,
      sourceOptions: currentDragSourceOptions,
      sourceDisconnect: disconnectCurrentDragSource,
      sourceDisconnectId: disconnectCurrentDragSource && disconnectCurrentDragSource.sourceId,
      preview: currentDragPreviewNode,
      previewOptions: currentDragPreviewOptions,
      previewDisconnect: disconnectCurrentDragPreview,
      previewDisconnectId: disconnectCurrentDragPreview && disconnectCurrentDragPreview.sourceId,
      backend
    }, data));

  }

  function reconnectDragSource() {
    log('source reconnect');

    if (disconnectCurrentDragSource) {
      disconnectCurrentDragSource();
      disconnectCurrentDragSource = null;
    }

    if (currentHandlerId && currentDragSourceNode) {
      disconnectCurrentDragSource = backend.connectDragSource(
        currentHandlerId,
        currentDragSourceNode,
        currentDragSourceOptions
      );
    }
  }

  function reconnectDragPreview() {
    log('preview reconnect');

    if (disconnectCurrentDragPreview) {
      disconnectCurrentDragPreview();
      disconnectCurrentDragPreview = null;
    }

    if (currentHandlerId && currentDragPreviewNode) {
      disconnectCurrentDragPreview = backend.connectDragPreview(
        currentHandlerId,
        currentDragPreviewNode,
        currentDragPreviewOptions
      );
    }
  }

  function receiveHandlerId(handlerId) {
    if (handlerId === currentHandlerId) {
      return;
    }

    log('update', {id2: handlerId});

    currentHandlerId = handlerId;
    reconnectDragSource();
    reconnectDragPreview();
  }

  const hooks = wrapConnectorHooks({
    dragSource: function connectDragSource(node, options) {
      if (
        node === currentDragSourceNode &&
        areOptionsEqual(options, currentDragSourceOptions)
      ) {
        return;
      }

      log('source connect', {source2: node, sourceOptions2: options});

      currentDragSourceNode = node;
      currentDragSourceOptions = options;

      reconnectDragSource();
    },

    dragPreview: function connectDragPreview(node, options) {
      if (
        node === currentDragPreviewNode &&
        areOptionsEqual(options, currentDragPreviewOptions)
      ) {
        return;
      }

      log('preview connect', {preview2: node, previewOptions2: options});

      currentDragPreviewNode = node;
      currentDragPreviewOptions = options;

      reconnectDragPreview();
    }
  });

  return {
    receiveHandlerId,
    hooks
  };
}

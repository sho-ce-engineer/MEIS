import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const render = vi.fn();

// api.jsの読み込みが終わった状態を再現する
const loadRecaptcha = () => {
  vi.stubGlobal('grecaptcha', { render });
};

const setContainerExists = (exists: boolean) => {
  vi.stubGlobal('document', {
    getElementById: () => (exists ? {} : null),
  });
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// 読み込み完了の状態をモジュール内に持つため、テストごとに読み込み直す
const importRenderRecaptcha = async () =>
  (await import('./renderRecaptcha')).renderRecaptcha;

describe('renderRecaptcha', () => {
  beforeEach(() => {
    vi.resetModules();
    render.mockClear();
    // ブラウザと同じく、window経由でもグローバル経由でもgrecaptchaを参照できるようにする
    vi.stubGlobal('window', globalThis);
    setContainerExists(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(globalThis, 'onRecaptchaLoad');
  });

  it('reCAPTCHAが読み込み済みの場合、すぐに描画する', async () => {
    loadRecaptcha();
    const renderRecaptcha = await importRenderRecaptcha();

    await renderRecaptcha('g-recaptcha', 'site-key');

    expect(render).toHaveBeenCalledWith('g-recaptcha', { sitekey: 'site-key' });
  });

  it('reCAPTCHAの読み込み前の場合、エラーにせずonloadの呼び出しを待ってから描画する', async () => {
    const renderRecaptcha = await importRenderRecaptcha();

    const rendering = renderRecaptcha('g-recaptcha', 'site-key');
    await flushPromises();
    expect(render).not.toHaveBeenCalled();

    loadRecaptcha();
    window.onRecaptchaLoad?.();

    await expect(rendering).resolves.toBeUndefined();
    expect(render).toHaveBeenCalledWith('g-recaptcha', { sitekey: 'site-key' });
  });

  it('待っている間に描画先が無くなった場合、描画しない', async () => {
    const renderRecaptcha = await importRenderRecaptcha();

    const rendering = renderRecaptcha('g-recaptcha', 'site-key');
    setContainerExists(false);
    loadRecaptcha();
    window.onRecaptchaLoad?.();
    await rendering;

    expect(render).not.toHaveBeenCalled();
  });

  it('読み込み完了後に再び呼び出した場合、onloadを待たずに描画する', async () => {
    const renderRecaptcha = await importRenderRecaptcha();

    const firstRendering = renderRecaptcha('g-recaptcha', 'site-key');
    loadRecaptcha();
    window.onRecaptchaLoad?.();
    await firstRendering;

    await renderRecaptcha('g-recaptcha', 'site-key');

    expect(render).toHaveBeenCalledTimes(2);
  });
});

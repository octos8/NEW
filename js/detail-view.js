const closeLink = document.querySelector('.back-link');
closeLink?.setAttribute('aria-label', '상세페이지 탭 닫기');
closeLink?.addEventListener('click', event => {
    event.preventDefault();
    const returnUrl = event.currentTarget.href;
    window.close();

    // Directly opened tabs may not allow closing; keep the return link usable.
    window.setTimeout(() => {
        if (!window.closed) window.location.assign(returnUrl);
    }, 150);
});

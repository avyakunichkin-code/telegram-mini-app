for (const group of document.querySelectorAll('.examples')) {
  for (const name of group.dataset.order.split(' ')) {
    const example = document.getElementById(name).content.firstElementChild.cloneNode(true);
    example.id = group.dataset.version + '-' + name;
    group.append(example);
  }
}

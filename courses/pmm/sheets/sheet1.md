---
id: sheet1
number: 1
title: Measure spaces
source: "B8.1 Probability, Measure and Martingales, MT2025, Problem Sheet 1 (Harald Oberhauser)"
---

:::sheetsection{letter=A title="Section A (warm-up)"}

::::question{#sheet1-a1 label="A1" uses="ch1-def-algebra"}
Let $\Omega$ be a set.

:::part{#sheet1-a1a label="(a)"}
Show that the collection of all sets $A \in \Pow(\Omega)$ such that either $A$ or $A\comp$ is countable is a $\sigma$-algebra.
:::

:::part{#sheet1-a1b label="(b)"}
Give an example of two algebras $\F_1$ and $\F_2$ on $\Omega = \{1, 2, 3\}$ whose union $\F_1 \cup \F_2$ is not an algebra.
:::

:::part{#sheet1-a1c label="(c)"}
Suppose that $\{\F_j\}_{j \in J}$ is a non-empty family of $\sigma$-algebras on $\Omega$. Prove that the intersection $\bigcap_{j \in J} \F_j$ is a $\sigma$-algebra on $\Omega$.
:::
::::

::::question{#sheet1-a2 label="A2" pending="measurable functions (Chapter 2)"}
Let $(f_n)$ be a sequence of measurable functions on $(\Omega, \F)$ taking values in $\Rbar$. Show that $f_1 + f_2$, $\max\{f_1, f_2\}$ and $\sup_n f_n$ are all measurable functions.
::::

::::question{#sheet1-a3 label="A3" uses="ch1-def-measure-space ch1-def-algebra"}
On $\R$ consider the $\sigma$-algebra $\A$ of sets which are either countable or have a countable complement. Let $\mu(A) = 0$ for countable $A$ and $\mu(A) = 1$ otherwise, $A \in \A$. Show that $\mu$ is a probability measure on $\A$.
::::

:::

:::sheetsection{letter=B title="Section B (to be handed in)"}

::::question{#sheet1-b1 label="B1" uses="ch1-def-algebra"}
Let $\mathcal{P} = \{P_j\}_{j \in J}$ be a partition of a set $\Omega$ (that is, a collection of disjoint non-empty sets with union $\Omega$). Show that the set $\mathcal{U}(\mathcal{P})$ consisting of all possible unions of sets $P_j$ is a $\sigma$-algebra on $\Omega$. Conversely, show that any $\sigma$-algebra $\F$ on a countable set $\Omega$ is of the form $\mathcal{U}(\mathcal{P})$ for some partition $\mathcal{P}$ of $\Omega$. [Warning: the converse is very far from true when $\Omega$ is uncountable.]
::::

::::question{#sheet1-b2 label="B2" uses="ch1-def-borel ch1-def-generated ch1-ex-pi-r"}
Let $\T$ be the set of all open subsets of $\R$, and let $\pi(\R)$ be the $\pi$-system
$$\pi(\R) := \{(-\infty, x] : x \in \R\}.$$
Prove that $\B(\R)$ (defined to be $\sigma(\T)$) is equal to $\sigma(\pi(\R))$. [Hint: recall that every open subset of $\R$ is a countable disjoint union of (finite or infinite) open intervals.]
::::

::::question{#sheet1-b3 label="B3" uses="ch1-def-set-function ch1-def-algebra ch1-lem-cont-empty"}
Let $\mu : \A \to [0, \infty)$ be an additive set function on an algebra $\A$ taking only finite values. Show that $\mu$ is countably additive iff for every sequence $(A_n)$ of sets in $\A$ with $A_n \downarrow \emptyset$ we have $\mu(A_n) \to 0$.
::::

::::question{#sheet1-b4 label="B4" uses="ch1-thm-uniqueness ch1-def-pi-system"}
Let $\Omega$ be a set and $\I$ a $\pi$-system on $\Omega$. Let $\F = \sigma(\I)$. Suppose that $\mu_1$ and $\mu_2$ are two measures on $(\Omega, \F)$ with $\mu_1(\Omega) = \mu_2(\Omega) < \infty$ and $\mu_1 = \mu_2$ on $\I$. Then a theorem in lectures shows that $\mu_1 = \mu_2$ on $\F$. Find an example on $\Omega = \{1, 2, 3, 4\}$ where this fails if we drop the assumption that $\I$ is a $\pi$-system.
::::

::::question{#sheet1-b5 label="B5" uses="ch1-rem-mleb ch1-def-borel"}
Revise the definition of Lebesgue outer measure $m^*(A)$ and the $\sigma$-algebra $\MLeb$ of Lebesgue-measurable sets.^[The Lebesgue outer measure $m^*(A)$ of any set $A \subseteq \R$ is $\inf\{\sum_{i=1}^\infty |J_i| : J_1, J_2, \ldots \text{ are intervals with } \bigcup_{i=1}^\infty J_i \supseteq A\}$, and $A$ is Lebesgue measurable if $m^*(F \cap A) + m^*(F \cap A\comp) = m^*(F)$ for any $F \subseteq \R$.] Show that $A \subseteq [0, 1]$ is Lebesgue measurable if and only if there exist a Borel set $B$ and a null set $N$ such that $A = B \mathbin{\Delta} N$, where $\Delta$ denotes symmetric difference. Extend this to any $A \subseteq \R$.
::::

::::question{#sheet1-b6 label="B6" uses="ch1-ex-discrete ch1-def-measure-space"}
Show that if $\Omega$ is countable then there is a bijection between measures on $(\Omega, \Pow(\Omega))$ and mass functions on $\Omega$.
::::

:::

:::sheetsection{letter=C title="Section C (extra practice questions, not for hand-in)"}

::::question{#sheet1-c1 label="C1" uses="ch1-def-borel ch1-def-generated ch1-ex-pi-r"}
Show that the following sets of subsets of $\R$ all generate the same $\sigma$-algebra:
$$\{(a, b) : a < b\}, \qquad \{(a, b] : a < b\}, \qquad \{(-\infty, b] : b \in \R\}.$$
::::

::::question{#sheet1-c2 label="C2" uses="ch1-def-algebra"}
Given $\alpha < \beta$, let $\A$ be the family of finite unions of disjoint intervals of the form
$$A = (a_1, b_1] \cup \cdots \cup (a_n, b_n], \qquad \alpha \le a_i < b_i \le \beta, \quad 1 \le i \le n.$$
Show that $\A$ is an algebra.
::::

::::question{#sheet1-c3 label="C3" uses="ch1-def-measure-space ch1-def-pi-system ch1-def-generated ch1-thm-uniqueness"}
Let $\A$ be a collection of subsets of a non-empty set $\Omega$. Show that

1. $\Omega \in \A$,
2. $A, B \in \A$, $A \subseteq B \implies B \setminus A \in \A$, and
3. $A_n \in \A$, $A_n \uparrow A \implies A \in \A$

hold (jointly, of course) if and only if

1. $\Omega \in \A$,
2. $A \in \A \implies A\comp \in \A$, and
3. $\A$ is closed under countable disjoint unions.

Either condition defines what is variously called a *d-system*, *$\lambda$-system* or *Dynkin system*.

- Show that if $\mu_1, \mu_2$ are measures on $(\Omega, \F)$ with $\mu_1(\Omega) = \mu_2(\Omega) < \infty$, then $\{A : \mu_1(A) = \mu_2(A)\}$ is a Dynkin system.
- Show that if $\A$ is a Dynkin system and a $\pi$-system, then it is a $\sigma$-algebra.
- (Very hard) Show that the Dynkin system generated by a $\pi$-system $\A$ (that is, the intersection of all Dynkin systems containing $\A$) is a $\pi$-system and so a $\sigma$-algebra.
::::

:::

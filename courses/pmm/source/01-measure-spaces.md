---
id: ch1
number: 1
slug: measure-spaces
title: Measure spaces
notes_pages: 8–14
summary: σ-algebras, measures, π-systems, the uniqueness and Carathéodory extension theorems, and the correspondence between distribution functions and Borel probability measures on ℝ.
colophon: No non-measurable sets were constructed in the making of this chapter.
---

Probability needs a way to assign a size to sets of outcomes, and to do it consistently: the size of a disjoint union should be the sum of the sizes, the whole space should have size one, and so on. Part A Integration did this for length on $\R$. This chapter sets up the same machinery for an arbitrary set $\Omega$, so that later chapters can treat a probability, an integral against a density and a sum over a countable set as instances of one theory.

The sets we measure will be *events*, subsets of a sample space $\Omega$, and their size will be a probability. Recall that $\Pow(\Omega)$ denotes the power set of $\Omega$, the set of all subsets of $\Omega$.^[Most of this chapter revises Part A Integration, now for a general $\Omega$ and with probability in view. The genuinely new parts are [@>ch1-thm-uniqueness] and the proof of [@>ch1-thm-lebesgue].]

## $\sigma$-algebras and measures {#ch1-s-measures difficulty=1 importance=core dnote="definitions and short arguments, mostly revision from Part A" inote="every later chapter is phrased in this language"}

We cannot always assign a size to every subset of $\Omega$ (Part A constructed a subset of $\R$ with no sensible length), so a measure comes with a collection of sets on which it is defined. That collection has to be closed under the operations we want to perform on events: complements ("$A$ does not happen") and unions ("$A$ or $B$ happens"). The definition below asks for exactly this, first for finitely many operations and then for countably many.

:::definition{#ch1-def-algebra notes="1.1" page=9 title="Algebras and $\sigma$-algebras"}
Let $\Omega$ be a set and let $\A \subseteq \Pow(\Omega)$ be a collection of subsets of $\Omega$.

1. We say that $\A$ is an [[algebra (on $\Omega$)|t-algebra]] if $\emptyset \in \A$ and for all $A, B \in \A$, $A\comp = \Omega \setminus A \in \A$ and $A \cup B \in \A$.
2. We say that $\A$ is a [[$\sigma$-algebra (on $\Omega$)|t-sigma-algebra]] if $\emptyset \in \A$, $A \in \A$ implies $A\comp \in \A$, and for all sequences $(A_n)_{n \ge 1}$ of elements of $\A$, $\bigcup_{n=1}^\infty A_n \in \A$.
:::

Since intersections can be built from complements and unions ($A \cap B = (A\comp \cup B\comp)\comp$), an algebra is closed under *finite* set operations and a $\sigma$-algebra is closed under *countable* set operations. Every $\sigma$-algebra is an algebra: take $A_1 = A$, $A_2 = B$ and $A_n = \emptyset$ for $n \ge 3$. We often don't bother saying "on $\Omega$", but $A\comp$ only makes sense once we know which $\Omega$ we are in. We tend to write $\F$ for a $\sigma$-algebra (some people say *$\sigma$-field*).^[The $\sigma$ is for "sum", in the old sense of countable union, as in $F_\sigma$ sets: countable unions of closed sets.]

The two smallest examples sit at the extremes: $\{\emptyset, \Omega\}$ and $\Pow(\Omega)$ are both $\sigma$-algebras. Between them, for any $A \subseteq \Omega$ the four sets $\{\emptyset, A, A\comp, \Omega\}$ form a $\sigma$-algebra, the smallest one in which "$A$ happens" is an event.

:::exercise{#ch1-ex-cofinite title="An algebra that is not a $\sigma$-algebra" uses="ch1-def-algebra"}
Let $\Omega = \N$ and let $\A$ be the collection of subsets $A \subseteq \N$ such that $A$ is finite or $A\comp$ is finite. Show that $\A$ is an algebra but not a $\sigma$-algebra.
:::hint
For the failure, find countably many finite sets whose union is neither finite nor has finite complement.
:::
:::answer
$\emptyset$ is finite, so $\emptyset \in \A$. If $A \in \A$ then either $A$ is finite, so $A\comp$ has finite complement, or $A\comp$ is finite; either way $A\comp \in \A$. For unions, take $A, B \in \A$. If both are finite, $A \cup B$ is finite. If one of them, say $A$, has finite complement, then $(A \cup B)\comp = A\comp \cap B\comp \subseteq A\comp$ is finite. So $A \cup B \in \A$, and $\A$ is an algebra.

It is not a $\sigma$-algebra: each singleton $\{2n\}$ is finite, so lies in $\A$, but $\bigcup_{n \ge 1} \{2n\}$ is the set of positive even numbers, which is infinite and has infinite complement (it misses every odd number).
:::
:::

:::sheet-prompt{q="sheet1-a1 sheet1-b1 sheet1-c2"}
:::

Now for the function that does the measuring. It is convenient to define the properties we want for a function on any collection of sets containing $\emptyset$, since later we will build measures by first defining them on a small collection and then extending.

:::definition{#ch1-def-set-function notes="1.2" page=9 title="Set functions"}
Let $\A$ be *any* set of subsets of $\Omega$ containing the empty set $\emptyset$. A [[set function|t-set-function]] on $\A$ is a function $\mu : \A \to [0, \infty]$ with $\mu(\emptyset) = 0$. We say that $\mu$ is

1. [[increasing|t-increasing]] if for all $A, B \in \A$ with $A \subseteq B$,
$$\mu(A) \le \mu(B),$$
2. [[additive|t-additive]] if for all *disjoint* $A, B \in \A$ with $A \cup B \in \A$ (note that we must specify this in general)
$$\mu(A \cup B) = \mu(A) + \mu(B),$$
3. [[countably additive|t-countably-additive]], or *$\sigma$-additive*, if for all sequences $(A_n)$ of disjoint sets in $\A$ with $\bigcup_{n=1}^\infty A_n \in \A$,
$$\mu\Bigl(\,\bigcup_{n=1}^\infty A_n\Bigr) = \sum_{n=1}^\infty \mu(A_n).$$
:::

The clause "with $A \cup B \in \A$" matters because $\A$ need not be closed under unions; on an algebra it is automatic for finite unions, but countable additivity on an algebra only constrains those sequences whose union happens to lie in the algebra. That distinction is the whole content of the extension problem in [@>ch1-s-extension].

A measure space is then a set $\Omega$ equipped with a $\sigma$-algebra $\F$ and a countably additive set function on $\F$.

:::definition{#ch1-def-measure-space notes="1.3" page=9 title="Measure spaces"}
A [[measurable space|t-measurable-space]] is a pair $(\Omega, \F)$ where $\F$ is a $\sigma$-algebra on $\Omega$.

A [[measure space|t-measure-space]] is a triple $(\Omega, \F, \mu)$ where $\Omega$ is a set, $\F$ is a $\sigma$-algebra on $\Omega$ and $\mu : \F \to [0, \infty]$ is a countably additive set function. We call $\mu$ a [[measure|t-measure]] on $(\Omega, \F)$ and say that $\mu$ is

1. [[finite|t-finite]] if $\mu(\Omega) < \infty$,
2. [[$\sigma$-finite|t-sigma-finite]] if there is a sequence $(E_n)_{n \ge 1}$ of sets from $\F$ with $\mu(E_n) < \infty$ for all $n$ and $\bigcup_{n=1}^\infty E_n = \Omega$,
3. a [[probability measure|t-probability-measure]] if $\mu(\Omega) = 1$.

*Convention:* if $\mu$ is a probability measure we call $(\Omega, \F, \mu)$ a [[probability space|t-probability-space]] and often write $\P$ instead of $\mu$ to emphasise this.
:::

Lebesgue measure on $\R$ is $\sigma$-finite but not finite: $\R = \bigcup_n [-n, n]$ and each $[-n,n]$ has length $2n$. Counting measure on an uncountable set (the measure giving every finite set its number of elements and every infinite set $\infty$) is not even $\sigma$-finite, since a countable union of finite sets is countable.^[$\sigma$-finiteness is the hypothesis that keeps most of the theory working when the total mass is infinite. It turns up again in [@>ch1-cor-lebesgue] and in Fubini's theorem in Chapter 2.]

Any measure $\mu$ is also additive and increasing. Additivity is countable additivity applied to $A, B, \emptyset, \emptyset, \dots$, using $\mu(\emptyset) = 0$. For monotonicity, if $A \subseteq B$ then $B = A \cup (B \setminus A)$ is a disjoint union, so $\mu(B) = \mu(A) + \mu(B \setminus A) \ge \mu(A)$. Measures also respect monotone limits, as you saw in Part A. To state this we need some notation.

:::notation{#ch1-not-monotone page=9 title="Monotone sequences of sets"}
For a sequence $(F_n)_{n \ge 1}$ of sets, $F_n \uparrow F$ means $F_n \subseteq F_{n+1}$ for all $n$ and $\bigcup_{n=1}^\infty F_n = F$. Similarly, $G_n \downarrow G$ means $G_n \supseteq G_{n+1}$ for all $n$ and $\bigcap_{n=1}^\infty G_n = G$.
:::

:::lemma{#ch1-lem-monotone notes="1.4" page=9 title="Monotone convergence properties"}
Let $(\Omega, \F, \mu)$ be a measure space.

1. If $(F_n)_{n \ge 1}$ is a sequence of sets from $\F$ with $F_n \uparrow F$, then $\mu(F_n) \uparrow \mu(F)$ as $n \to \infty$.
2. If $(G_n)_{n \ge 1}$ is a sequence of sets from $\F$ with $G_n \downarrow G$, and $\mu(G_k) < \infty$ for some $k \in \N$, then $\mu(G_n) \downarrow \mu(G)$ as $n \to \infty$.
:::

The notes refer to Part A for the proof. Here it is, since both halves get used repeatedly.

:::proof{title="Proof (as in Part A)"}
(1) The trick is to turn the increasing union into a disjoint one, where countable additivity applies. Put $D_1 = F_1$ and $D_n = F_n \setminus F_{n-1}$ for $n \ge 2$. These sets lie in $\F$, are disjoint, and satisfy $\bigcup_{k \le n} D_k = F_n$ and $\bigcup_{k} D_k = F$. So
$$
\begin{aligned}
\mu(F) &= \sum_{k=1}^\infty \mu(D_k) && \text{(countable additivity)}\\
&= \lim_{n \to \infty} \sum_{k=1}^n \mu(D_k) = \lim_{n \to \infty} \mu(F_n) && \text{(additivity)}.
\end{aligned}
$$
The sequence $\mu(F_n)$ is increasing because $\mu$ is, so the limit is an increasing limit.

(2) Pass to complements inside $G_k$, where everything is finite. For $n \ge k$ the sets $G_k \setminus G_n$ increase to $G_k \setminus G$, so by (1), $\mu(G_k \setminus G_n) \uparrow \mu(G_k \setminus G)$. Since $G_n \subseteq G_k$ and $\mu(G_n) \le \mu(G_k) < \infty$, additivity gives $\mu(G_k \setminus G_n) = \mu(G_k) - \mu(G_n)$, and similarly for $G$. Subtracting from the finite number $\mu(G_k)$ gives $\mu(G_n) \downarrow \mu(G)$.
:::

The condition $\mu(G_k) < \infty$ is essential in (2): take $G_n = (n, \infty) \subseteq \R$ with Lebesgue measure. Every $G_n$ has infinite measure but $\bigcap_n G_n = \emptyset$.^[viz:gn-toy|Drag $n$. However far right $G_n$ starts it still has infinite length, and no point lies in every $G_n$.] In the proof, this is where subtracting $\mu(G_n)$ from $\mu(G_k)$ breaks down: $\infty - \infty$ has no meaning.

The following partial converse is sometimes useful. It says that on an algebra, for a finite additive set function, countable additivity is equivalent to continuity at $\emptyset$. We will need it in the proof of [@>ch1-thm-lebesgue], where checking continuity at $\emptyset$ turns out to be easier than checking countable additivity directly.

:::lemma{#ch1-lem-cont-empty notes="1.5" page=10}
Let $\mu : \A \to [0, \infty)$ be an additive set function on an algebra $\A$ taking only finite values. Then $\mu$ is countably additive iff for every sequence $(A_n)$ of sets in $\A$ with $A_n \downarrow \emptyset$ we have $\mu(A_n) \to 0$.
:::

:::proof{title="Proof of one direction"}
The notes say one implication follows essentially from [@ch1-lem-monotone] and leave the other as an exercise; the exercise is Sheet 1, Question B3, so only the first is proved here.

Suppose $\mu$ is countably additive and $A_n \downarrow \emptyset$ with each $A_n \in \A$. We cannot quote [@ch1-lem-monotone] directly, because $\A$ is only an algebra, but its proof goes through. The sets $D_k = A_k \setminus A_{k+1}$ lie in $\A$ and are disjoint, and since $\bigcap_k A_k = \emptyset$, for each $n$
$$A_n = \bigcup_{k = n}^\infty D_k.$$
The union on the right is in $\A$ because it equals $A_n$, so countable additivity applies and $\mu(A_n) = \sum_{k \ge n} \mu(D_k)$. The case $n = 1$ shows that the series $\sum_k \mu(D_k)$ converges (to $\mu(A_1) < \infty$), so its tails $\mu(A_n)$ tend to $0$.
:::

:::sheet-prompt{q="sheet1-b3"}
This is the other direction of [@ch1-lem-cont-empty].
:::

There are many measure spaces, and several you already know. The simplest are those on countable sets, where the measure of every set is determined by the measures of points.

:::example{#ch1-ex-discrete notes="1.6" page=10 title="Discrete measure theory"}
Let $\Omega$ be a countable set. A [[mass function|t-mass-function]] on $\Omega$ is any function $\bar\mu : \Omega \to [0, \infty]$. Given such a $\bar\mu$ we can define a measure on $(\Omega, \Pow(\Omega))$ by setting $\mu(A) = \sum_{x \in A} \bar\mu(x)$. Equally, given a measure $\mu$ on $(\Omega, \Pow(\Omega))$ we can define a corresponding mass function by $\bar\mu(x) = \mu(\{x\})$.

For countable $\Omega$ there is a one-to-one correspondence between measures on $(\Omega, \Pow(\Omega))$ and mass functions.
:::

For instance a fair die is $\Omega = \{1, \dots, 6\}$ with $\bar\mu \equiv 1/6$, and counting measure on $\N$ is $\bar\mu \equiv 1$. The sum $\sum_{x \in A} \bar\mu(x)$ is a sum of non-negative terms, so it does not depend on the order in which $A$ is listed; that is what makes the definition of $\mu$ unambiguous.

:::sheet-prompt{q="sheet1-a3 sheet1-b6"}
:::

These discrete spaces are a toy version of the general theory, and in general they are not enough. Discrete measure theory is essentially the only setting in which one can write the measure down explicitly. In general a $\sigma$-algebra has no explicit description, and for an arbitrary $\Omega$ it is not true that every subset can be assigned a measure (recall the non-Lebesgue-measurable subset of $\R$ from Part A). Instead one proves that there *exists* a measure on a large enough collection of sets with the properties we want.

The approach, a variant of the one in Part A, is to specify the measure on a smaller class of subsets that "generate" the $\sigma$-algebra, as the singletons did in [@ch1-ex-discrete]. This leaves two problems.

1. *Construction.* Can the measure we specified on the small class be extended to the whole $\sigma$-algebra? This is usually handled by Carathéodory's extension theorem, [@>ch1-thm-caratheodory].
2. *Uniqueness.* Is there only one measure on the $\sigma$-algebra consistent with the specification? This can often be settled by a corollary of Dynkin's $\pi$-system lemma, [@>ch1-thm-uniqueness].

First we need some more definitions.

## Generating $\sigma$-algebras {#ch1-s-generating difficulty=1 importance=core dnote="definitions with one subtle point: generated sets have no explicit description" inote="σ(·) and π-systems are used in every uniqueness argument in the course"}

Usually we know a few sets that must be events (intervals, say) and want the smallest $\sigma$-algebra containing them. There may be no way to list its members, but it can be defined from above, as the intersection of all $\sigma$-algebras that contain the sets we care about.

:::definition{#ch1-def-generated notes="1.7" page=10 title="Generated $\sigma$-algebras"}
Let $\A$ be a collection of subsets of $\Omega$. Define
$$\sigma(\A) = \{A \subseteq \Omega : A \in \F \text{ for all } \sigma\text{-algebras } \F \text{ on } \Omega \text{ containing } \A\}.$$
Then $\sigma(\A)$ is a $\sigma$-algebra (exercise), which is called the [[$\sigma$-algebra generated by $\A$|t-generated]]. It is the smallest $\sigma$-algebra containing $\A$: if $\F \supseteq \A$ is a $\sigma$-algebra then $\F \supseteq \sigma(\A)$.
:::

The intersection is over a non-empty family, since $\Pow(\Omega)$ is always one of the $\sigma$-algebras containing $\A$. That an intersection of $\sigma$-algebras is again a $\sigma$-algebra is Sheet 1, Question A1(c). The "smallest" claim is then immediate: if $\F \supseteq \A$ is a $\sigma$-algebra, it is one of the sets being intersected, so it contains the intersection.

A useful habit is to prove that a property holds for every set in $\sigma(\A)$ by showing that the sets with the property form a $\sigma$-algebra containing $\A$. This replaces the impossible task of describing $\sigma(\A)$ with the easier one of checking three closure properties.^[This "good sets" argument is the measure-theoretic analogue of induction. [@>ch1-thm-uniqueness] needs a refined version, because the sets on which two measures agree need not be closed under unions.]

The most important generated $\sigma$-algebra is generated by the open sets of a topological space.

:::definition{#ch1-def-borel notes="1.8" page=10 title="Borel $\sigma$-algebra, Borel measure"}
Let $\Omega$ be a topological space with topology (that is, set of open sets) $\T$. Then the [[Borel $\sigma$-algebra|t-borel]] on $\Omega$ is the $\sigma$-algebra generated by the open sets:
$$\B(\Omega) = \sigma(\T).$$
A measure $\mu$ on $(\Omega, \B(\Omega))$ is called a [[Borel measure|t-borel-measure]] on $\Omega$.
:::

Note that $\B(\Omega)$ depends on the topology on $\Omega$, not only on the set. Usually the topology is understood: in particular, when $\Omega = \R$ we mean the usual Euclidean topology. Closed sets are Borel (they are complements of open sets), and so are countable intersections of open sets and countable unions of closed sets. In practice every subset of $\R$ you will meet in this course is Borel.

Generating sets are not unique, and a good choice makes proofs easier. For uniqueness of measures the right property is closure under intersections.

:::definition{#ch1-def-pi-system notes="1.9" page=10 title="$\pi$-system"}
Let $\I$ be a collection of subsets of $\Omega$. We say that $\I$ is a [[$\pi$-system|t-pi-system]] if $A, B \in \I$ implies $A \cap B \in \I$.
:::

Notice that an algebra is automatically a $\pi$-system. The point of the definition is that a $\pi$-system can be much smaller and simpler than any algebra containing it, as the next example shows.

:::example{#ch1-ex-pi-r notes="1.10" page=11}
The collection
$$\pi(\R) = \{(-\infty, x] : x \in \R\}$$
forms a $\pi$-system, and $\sigma(\pi(\R))$, the $\sigma$-algebra generated by $\pi(\R)$, is $\B(\R)$, the $\sigma$-algebra consisting of all Borel subsets of $\R$ (exercise).
:::

The $\pi$-system property is the easy half: $(-\infty, x] \cap (-\infty, y] = (-\infty, \min(x, y)]$. The other half, that these half-lines generate all Borel sets, is Sheet 1, Question B2. This $\pi$-system will matter because a probability measure on $\R$ evaluated on it gives exactly the distribution function, [@>ch1-def-distribution-function].

:::exercise{#ch1-ex-which-pi title="Spot the $\pi$-systems" uses="ch1-def-pi-system"}
Which of these collections of subsets of $\R$ are $\pi$-systems?

1. $\{(a, b) : a < b\}$, the non-empty bounded open intervals.
2. $\{(a, b] : a \le b\}$, the left-open, right-closed intervals, where $(a, a] = \emptyset$.
3. The set of all open subsets of $\R$.
4. The set of all intervals of length exactly $1$.
:::answer
1. Not a $\pi$-system: $(0, 1) \cap (2, 3) = \emptyset$, which is not of the form $(a, b)$ with $a < b$. (Every non-empty intersection of two such intervals is again one, so allowing $\emptyset$ would fix it.)
2. A $\pi$-system: $(a, b] \cap (c, d] = (\max(a, c), \min(b, d)]$ if $\max(a,c) \le \min(b,d)$, and $\emptyset = (a, a]$ otherwise.
3. A $\pi$-system: a finite intersection of open sets is open.
4. Not a $\pi$-system: $[0, 1] \cap [\tfrac12, \tfrac32] = [\tfrac12, 1]$ has length $\tfrac12$.
:::
:::

:::sheet-prompt{q="sheet1-b2 sheet1-c1"}
:::

## Uniqueness and existence of measures {#ch1-s-extension difficulty=2 importance=core dnote="two theorems whose proofs are not given in the notes; the ideas matter more than the details" inote="these two theorems are how every measure in the course is constructed and identified"}

Here is why we care about $\pi$-systems. If two finite measures agree on a $\pi$-system, they agree on everything it generates. To identify a measure it is therefore enough to know it on a $\pi$-system, which is often a very simple collection like $\pi(\R)$.

:::theorem{#ch1-thm-uniqueness notes="1.11" page=11 title="Uniqueness of extension"}
Let $\mu_1$ and $\mu_2$ be measures on the same measurable space $(\Omega, \F)$, and let $\I \subseteq \F$ be a $\pi$-system. If $\mu_1(\Omega) = \mu_2(\Omega) < \infty$ and $\mu_1 = \mu_2$ on $\I$, then $\mu_1 = \mu_2$ on $\sigma(\I)$.
:::

We will often apply the theorem to a $\pi$-system $\I$ with $\sigma(\I) = \F$, so the conclusion is that $\mu_1$ and $\mu_2$ are equal. The most important special case is that *two probability measures on $\Omega$ that agree on a $\pi$-system agree on the $\sigma$-algebra generated by it.*

For a proof of [@ch1-thm-uniqueness] see Williams, *Probability with Martingales*, Appendix A1. The argument is a refined version of the "good sets" idea from [@ch1-s-generating]. The collection of sets on which $\mu_1$ and $\mu_2$ agree is closed under complements (this uses $\mu_1(\Omega) = \mu_2(\Omega) < \infty$) and under countable *disjoint* unions, but there is no reason for it to be closed under arbitrary unions, so it need not be a $\sigma$-algebra. Dynkin's lemma says that a collection with these weaker closure properties which contains a $\pi$-system $\I$ contains all of $\sigma(\I)$. Sheet 1, Question C3 works through the details.^[Both hypotheses are needed. Without finiteness, see the exercise below. Without the $\pi$-system property, Sheet 1, Question B4 asks for a counterexample on a four-point set.]

:::sheet-prompt{q="sheet1-b4 sheet1-c3"}
:::

:::exercise{#ch1-ex-infinite-mass title="Infinite mass breaks uniqueness" uses="ch1-thm-uniqueness ch1-ex-pi-r"}
Let $\lambda$ be Lebesgue measure on $(\R, \B(\R))$. Find a measure $\nu \neq \lambda$ on $(\R, \B(\R))$ that agrees with $\lambda$ on the $\pi$-system $\pi(\R)$ and has $\nu(\R) = \lambda(\R)$. Which hypothesis of [@ch1-thm-uniqueness] fails?
:::answer
Take $\nu = 2\lambda$, that is, $\nu(A) = 2\lambda(A)$. This is a measure (multiplying a countably additive set function by $2$ keeps it countably additive). For every $x$, $\lambda((-\infty, x]) = \infty = \nu((-\infty, x])$, and $\lambda(\R) = \infty = \nu(\R)$. But $\lambda((0,1]) = 1 \neq 2 = \nu((0, 1])$, so $\nu \neq \lambda$ on $\B(\R) = \sigma(\pi(\R))$.

The failing hypothesis is $\mu_1(\Omega) = \mu_2(\Omega) < \infty$: the total masses agree but are infinite. In the proof this is where complements are lost, since $\mu(A\comp) = \mu(\Omega) - \mu(A)$ needs $\mu(\Omega) < \infty$.
:::
:::

That deals with uniqueness. Existence is the harder problem.

:::theorem{#ch1-thm-caratheodory notes="1.12" page=11 title="Carathéodory extension theorem"}
Let $\Omega$ be a set and $\A$ an algebra on $\Omega$, and let $\F = \sigma(\A)$. Let $\mu_0 : \A \to [0, \infty]$ be a countably additive set function. Then there exists a measure $\mu$ on $(\Omega, \F)$ such that $\mu = \mu_0$ on $\A$.
:::

:::remark{#ch1-rem-carath-unique page=11 title="Uniqueness of the extension" toc=false}
If $\mu_0(\Omega) < \infty$, then [@ch1-thm-uniqueness] tells us that $\mu$ is unique, since an algebra is certainly a $\pi$-system.
:::

The Carathéodory extension theorem does not by itself construct measures on $\sigma$-algebras. It reduces the problem to constructing countably additive set functions on algebras, which is a big step, because algebras can be described explicitly and $\sigma$-algebras usually cannot. We will see several examples. In particular we will use it to give an essentially complete and practically useful description of the probability measures on $(\R, \B(\R))$.

:::nonexaminable
The proof of the Carathéodory extension theorem is not examinable. Here are some of the ideas; this is much the same as the proof of the existence of Lebesgue measure in Part A Integration. First one defines the *outer measure* $\mu^*(B)$ of any $B \subseteq \Omega$ by
$$\htmlData{tip=Outer measure: defined for every subset of Ω}{\mu^*(B)} = \inf \Bigl\{ \sum_{j=1}^\infty \mu_0(A_j) : \htmlData{tip=Covering sets come from the algebra where μ₀ is known}{A_j \in \A}, \ \bigcup_{j=1}^\infty A_j \supseteq B \Bigr\}.$$
Then one defines a set $B$ to be *measurable* if for all sets $E$,
$$\mu^*(E) = \mu^*(E \cap B) + \mu^*(E \cap B\comp).$$
(Alternatively, if $\mu_0(\Omega)$ is finite, one can define $B$ to be measurable if $\mu^*(B) + \mu^*(B\comp) = \mu_0(\Omega)$; this more intuitive definition says that it is possible to cover $B$ and $B\comp$ "efficiently" with sets from $\A$.) One must check that $\mu^*$ defines a countably additive set function on the collection of measurable sets extending $\mu_0$, and that the measurable sets form a $\sigma$-algebra that contains $\A$. For details see Appendix A1 of Williams, or Varadhan and the references therein.
:::

The first application is Lebesgue measure itself.

:::corollary{#ch1-cor-lebesgue notes="1.13" page=11}
There exists a unique Borel measure $\mu$ on $\R$ such that for all $a, b \in \R$ with $a < b$, $\mu((a, b]) = b - a$. The measure $\mu$ is the [[Lebesgue measure|t-lebesgue-measure]] on $\B(\R)$.
:::

The notes leave the proof of [@ch1-cor-lebesgue] as an exercise. The hard part is checking countable additivity on a suitable algebra; the proof of [@>ch1-thm-lebesgue] below does a closely related case. An extra step is needed for uniqueness, because $\mu(\R) = \infty$ and so [@ch1-thm-uniqueness] does not apply directly (the exercise above shows what can go wrong). Since $\mu$ is $\sigma$-finite, one can apply [@ch1-thm-uniqueness] to the restrictions of two candidate measures to each $(-n, n]$, which have finite mass $2n$, and then let $n \to \infty$ using [@ch1-lem-monotone].

:::remark{#ch1-rem-mleb page=12 title="Borel versus Lebesgue measurable sets"}
In Part A Integration, Lebesgue measure was defined on a $\sigma$-algebra $\MLeb$ that contains, but is strictly larger than, $\B(\R)$. It turns out (exercise) that $\MLeb$ consists of all sets that differ from a Borel set by a null set. In this course we work with $\B(\R)$ rather than $\MLeb$: the Borel $\sigma$-algebra is large enough for us. (This changes later, when studying continuous-time martingales.) An advantage of $\B(\R)$ is that it has a simple definition independent of the measure; which sets are null depends on which measure is being considered.
:::

:::sheet-prompt{q="sheet1-b5"}
:::

## Distribution functions {#ch1-s-distribution difficulty=3 importance=core dnote="the proof of Theorem 1.15 is the first real compactness argument in the course" inote="distribution functions are how every real random variable is described"}

In the toy example of discrete measure theory there was a one-to-one correspondence between measures and mass functions. Is there anything similar for Borel measures on $\R$, that is, for measures on $(\R, \B(\R))$? A single point usually has measure zero, so mass functions are useless. The $\pi$-system $\pi(\R)$ suggests recording instead the mass of each half-line.

:::definition{#ch1-def-distribution-function notes="1.14" page=12}
Let $\mu$ be a Borel probability measure on $\R$. The [[distribution function|t-distribution-function]] of $\mu$ is the function $F : \R \to \R$ defined by $F(x) = \mu((-\infty, x])$.
:::

Any distribution function $F$ has the following properties:

1. $F$ is (weakly) increasing, that is, $x < y$ implies $F(x) \le F(y)$;
2. $F(x) \to 0$ as $x \to -\infty$ and $F(x) \to 1$ as $x \to \infty$;
3. $F$ is right continuous: $y \downarrow x$ implies $F(y) \to F(x)$.

The first holds because $\mu$ is increasing and $(-\infty, x] \subseteq (-\infty, y]$. The second follows from [@ch1-lem-monotone] applied to $(-\infty, -n] \downarrow \emptyset$ and $(-\infty, n] \uparrow \R$ (with a short argument to pass from integers $n$ to real $x$, using that $F$ is increasing). For the third, suppose that $y_n \downarrow x$ and let $A_n = (-\infty, y_n]$. Then $A_n \downarrow A = (-\infty, x]$. Thus, by [@ch1-lem-monotone], $F(y_n) = \mu(A_n) \downarrow \mu(A) = F(x)$; the finiteness condition holds because $\mu$ is a probability measure. We often write $F(-\infty) = 0$ and $F(\infty) = 1$ as shorthand for the second property.

Right continuity is the asymmetric one, and it comes from the choice of closed right endpoint in $(-\infty, x]$. Approaching $x$ from the left, $(-\infty, y_n] \uparrow (-\infty, x)$, which misses the point $x$, so [@ch1-lem-monotone] gives $F(x-) := \lim_{y \uparrow x} F(y) = \mu((-\infty, x))$. The jump $F(x) - F(x-)$ is therefore exactly $\mu(\{x\})$, the mass sitting at the point $x$.

:::viz{#ch1-fig-distribution src=distribution-explorer title="Reading a measure off its distribution function" caption="Drag the endpoints $a$ and $b$, or choose another distribution. The rise of $F$ over the interval is its mass; change the interval type to see when a jump of $F$ at an endpoint is counted."}
An interactive plot of a distribution function F. Two draggable points a and b on the horizontal axis select an interval. The vertical rise of F between them is shaded and its value is shown as the measure of the interval, with formulas F(b) minus F(a) for (a,b], F(b) minus F(a-) for [a,b], F(b-) minus F(a) for (a,b) and F(b-) minus F(a-) for [a,b). Presets: uniform on [0,1], a fair die, a mixture with an atom at 0, and the Cantor function.
:::

:::exercise{#ch1-ex-read-off title="Reading off masses" uses="ch1-def-distribution-function ch1-lem-monotone"}
Let $\mu$ be the Borel probability measure whose distribution function is
$$F(x) = \begin{cases} 0, & x < 0, \\ \tfrac12 + \tfrac{x}{4}, & 0 \le x < 2, \\ 1, & x \ge 2. \end{cases}$$
Find $\mu(\{0\})$, $\mu((0, 1])$, $\mu([0, 1))$ and $\mu(\{2\})$.
:::hint
$\mu((a, b]) = F(b) - F(a)$ by additivity, and $\mu(\{x\}) = F(x) - F(x-)$.
:::
:::answer
$F$ jumps by $\tfrac12$ at $0$ (from $0$ to $\tfrac12$) and is continuous at $2$, since $\tfrac12 + \tfrac24 = 1$.

$\mu(\{0\}) = F(0) - F(0-) = \tfrac12 - 0 = \tfrac12$.

$\mu((0, 1]) = F(1) - F(0) = \tfrac34 - \tfrac12 = \tfrac14$, because $(-\infty, 1]$ is the disjoint union of $(-\infty, 0]$ and $(0, 1]$.

$\mu([0, 1)) = F(1-) - F(0-) = \tfrac34 - 0 = \tfrac34$: the interval now contains the atom at $0$ and misses the point $1$, which carries no mass.

$\mu(\{2\}) = F(2) - F(2-) = 1 - 1 = 0$.
:::
:::

Using the Carathéodory extension theorem we can construct all Borel probability measures on $\R$: there is one for each distribution function. Since every non-zero finite measure is a probability measure multiplied by a constant, this characterises all finite measures on $\B(\R)$.

:::theorem{#ch1-thm-lebesgue notes="1.15" page=12 title="Lebesgue"}
Let $F : \R \to \R$ be an increasing, right continuous function with $F(-\infty) = 0$ and $F(\infty) = 1$. Then there is a unique Borel probability measure $\mu = \mu_F$ on $\R$ such that $\mu((-\infty, x]) = F(x)$ for every $x$. Every Borel probability measure $\mu$ on $\R$ arises in this way.
:::

In other words, there is a one-to-one correspondence between distribution functions and Borel probability measures on $\R$. This is why, in Prelims, a random variable could be described by its distribution function alone.

:::idea
Uniqueness and the last sentence are quick consequences of [@ch1-thm-uniqueness]. For existence, $F$ tells us what $\mu$ must do on finite unions of intervals $(a, b]$, which form an algebra, and Carathéodory extends it, provided the resulting set function is countably additive. By [@ch1-lem-cont-empty] that means showing $\mu_0(A_n) \to 0$ whenever $A_n \downarrow \emptyset$. Mass could fail to vanish in two ways: by escaping to infinity, or by piling up at a left endpoint that the half-open intervals exclude. Truncating to a bounded interval rules out the first. Right continuity lets us shrink each interval slightly so that its closure still sits inside the original set, which rules out the second. Then the sets are nested and compact, and nested non-empty compact sets have a common point.
:::

:::proof
Suppose for the moment that the existence statement holds. Since $\pi(\R) = \{(-\infty, x] : x \in \R\}$ is a $\pi$-system which generates $\B(\R)$ ([@ch1-ex-pi-r]), uniqueness follows by [@ch1-thm-uniqueness], as both measures have total mass $1$. For the final part, let $\mu$ be any Borel probability measure on $\R$ and let $F$ be its distribution function. Then $F$ has the properties required in the first part of the theorem (we checked them above), and we obtain a measure $\mu_F$ which by uniqueness is the measure $\mu$ we started with.

For existence we apply [@ch1-thm-caratheodory], so first we need a suitable algebra. For $-\infty \le a \le b < \infty$ let $I_{a,b} = (a, b]$, and set $I_{a,\infty} = (a, \infty)$. So $I_{a,b} = \{x \in \R : a < x \le b\}$. Let $\I = \{I_{a,b} : -\infty \le a \le b \le \infty\}$ be the collection of intervals that are open on the left and closed on the right. Let $\A$ be the set of finite disjoint unions of elements of $\I$; then $\A$ is an algebra, and $\sigma(\A) = \sigma(\I) = \B(\R)$.^[The algebra property is Sheet 1, Question C2 restricted to a bounded window; the complement of $(a, b]$ is $(-\infty, a] \cup (b, \infty)$, again in $\A$. The generating claim is close to Sheet 1, Question B2.]

We can define a set function $\mu_0$ on $\A$ by setting
$$\mu_0(I_{a,b}) = F(b) - F(a)$$
for intervals, and extending it to $\A$ by defining it as the sum for disjoint unions from $\I$. It is an easy exercise to show that $\mu_0$ is well defined (it does not depend on how a set is written as a disjoint union) and finitely additive. Carathéodory's extension theorem tells us that $\mu_0$ extends to a probability measure on $\B(\R)$ *provided* that $\mu_0$ is *countably* additive on $\A$. Proving this is slightly tricky. Note that we will have to use right continuity at some point.

First note that by [@ch1-lem-cont-empty], since $\mu_0$ is finite and additive on $\A$, it is countably additive if and only if, for any sequence $(A_n)$ of sets from $\A$ with $A_n \downarrow \emptyset$, $\mu_0(A_n) \downarrow 0$.

Suppose that $F$ has the stated properties but, for a contradiction, that there exist $A_1, A_2, \ldots \in \A$ with $A_n \downarrow \emptyset$ but $\mu_0(A_n) \not\to 0$. Since $\mu_0(A_n)$ is a decreasing sequence, there is some $\delta > 0$ (namely, $\lim \mu_0(A_n)$) such that $\mu_0(A_n) \ge \delta$ for all $n$. We look for a descending sequence of *compact* sets; if all the sets in such a sequence are non-empty, so is their intersection.

<span class="step">Step 1.</span> Replace $A_n$ by $B_n = A_n \cap (-l, l]$. Since
$$\mu_0(A_n \setminus B_n) \le \mu_0\bigl((-\infty, -l] \cup (l, \infty)\bigr) = F(-l) + 1 - F(l),$$
and the right-hand side tends to $0$ as $l \to \infty$, if we take $l$ large enough then $\mu_0(B_n) \ge \delta/2$ for all $n$. The first inequality holds because $\mu_0$ is increasing on $\A$, which follows from additivity exactly as for measures. Note that $l$ is chosen once and works for every $n$.

<span class="step">Step 2.</span> Suppose that $B_n = \bigcup_{i=1}^{k_n} I_{a_{n,i}, b_{n,i}}$. Let $C_n = \bigcup_{i=1}^{k_n} I_{\tilde a_{n,i}, b_{n,i}}$ where $a_{n,i} < \tilde a_{n,i} < b_{n,i}$, and use right continuity of $F$ to do this in such a way that
$$\mu_0(B_n \setminus C_n) < \frac{\delta}{2^{n+2}} \quad \text{for each } n.$$
This is possible because $\mu_0(B_n \setminus C_n) = \sum_i \bigl(F(\tilde a_{n,i}) - F(a_{n,i})\bigr)$, and right continuity at $a_{n,i}$ makes each term as small as we like by taking $\tilde a_{n,i}$ close enough to $a_{n,i}$. Let $\overline{C}_n$ be the closure of $C_n$ (obtained by adding the points $\tilde a_{n,i}$ to $C_n$). Then $\overline{C}_n \subseteq B_n$, because $\tilde a_{n,i} > a_{n,i}$.

<span class="step">Step 3.</span> The sequence $(C_n)$ need not be decreasing, so set $D_n = \bigcap_{i=1}^n C_i$ and $E_n = \bigcap_{i=1}^n \overline{C}_i$. Since $B_n \subseteq B_i$ for $i \le n$, every point of $B_n \setminus D_n$ lies in some $B_i \setminus C_i$, so
$$\mu_0(D_n) \ge \mu_0(B_n) - \sum_{i=1}^n \mu_0(B_i \setminus C_i) \ge \frac{\delta}{2} - \sum_{i=1}^n \frac{\delta}{2^{i+2}} \ge \frac{\delta}{4},$$
and so $D_n$ is non-empty. Thus $E_n \supseteq D_n$ is non-empty.

Each $E_n$ is closed and bounded, and so compact. Also, each $E_n$ is non-empty, and $E_{n+1} \subseteq E_n$. Hence, by a basic result from topology (the finite intersection property of compact sets), there is some $x$ such that $x \in E_n$ for all $n$. Since $E_n \subseteq \overline{C}_n \subseteq B_n \subseteq A_n$, we have $x \in A_n$ for all $n$, contradicting $A_n \downarrow \emptyset$.
:::

The proof uses right continuity in exactly one place, Step 2, and the figure below shows that it cannot be dropped. It runs the construction on the sets $A_n = (0, 1/n] \cup (n, \infty)$, which decrease to $\emptyset$. Both ways for mass to survive are present: the piece $(n, \infty)$ runs off to infinity, and the piece $(0, 1/n]$ shrinks towards the excluded point $0$.

:::viz{#ch1-fig-stepper src=compactness-stepper wide=true title="The compactness argument, step by step" caption="Step through the proof of countable additivity for $A_n = (0, 1/n] \cup (n, \infty)$. Then switch $F$ to a version that is not right continuous at $0$ and watch Step 2 fail."}
A proof stepper with five steps showing rows for A_1 to A_6 on a number line. Step 1 truncates to (-l, l]. Step 2 shrinks each interval's left endpoint to get C_n and its closure. Step 3 forms the intersections D_n and E_n. The final step shows that E_n becomes empty, so the assumption that the masses stay above delta must fail. A toggle replaces F by a function that is left continuous at 0, where Step 2 cannot be carried out because every interval (0, a] has mass at least 0.3.
:::

## Densities, atoms and other examples {#ch1-s-examples difficulty=1 importance=standard dnote="examples, no new proofs" inote="familiar from Prelims; the Cantor example is a useful warning"}

The function $F$ is the *distribution function* corresponding to the probability measure $\mu$. When $F$ is continuously differentiable, say, it is precisely the cumulative distribution function of a continuous random variable with probability density function $f(x) = F'(x)$, as in Prelims.

More generally, if $f(x) \ge 0$ is measurable and (Lebesgue) integrable with $\int_{-\infty}^\infty f(x) \dd x = 1$, then we can use $f$ as a density function to construct a measure $\mu$ on $(\R, \B(\R))$ by setting
$$\mu(A) = \int_A f(x) \dd x.$$
This measure has distribution function $F(x) = \int_{-\infty}^x f(y) \dd y$. (It is not necessarily true that $F'(x) = f(x)$ for all $x$, but this holds for almost all $x$.) For example, taking $f(x) = 1$ on $(0, 1)$, or on $[0, 1]$, and $f(x) = 0$ otherwise, we obtain the distribution function $F$ with $F(x) = 0$ for $x < 0$, $F(x) = x$ for $0 \le x \le 1$ and $F(x) = 1$ for $x > 1$, corresponding to the uniform distribution on $[0, 1]$.^[That $f$ can be changed at the two endpoints without changing $\mu$ is the reason a density is only defined "almost everywhere". The integral uses Part A Lebesgue integration; Chapter 2 sets it up for general measures.]

For a very different example, let $x_1, x_2, \ldots$ be a sequence of points (for example the non-negative integers) with probabilities $p_n > 0$ at these points and $\sum_n p_n = 1$. For the discrete probability measure
$$\mu(A) = \sum_{n : x_n \in A} p_n$$
the distribution function is
$$F(x) = \sum_{n : x_n \le x} p_n,$$
which increases by jumps, the jump at $x_n$ being of height $p_n$. The picture can be complicated, for example if there is a jump at every rational: enumerate $\Q = \{q_1, q_2, \dots\}$ and put mass $2^{-n}$ at $q_n$. The resulting $F$ is strictly increasing and is discontinuous at every rational, yet it is still right continuous everywhere.

There are also continuous distribution functions $F$ that don't come from any density $f$, for example the Devil's staircase, which corresponds (roughly speaking) to the uniform distribution on the Cantor set. It is continuous, increases from $0$ to $1$, and is constant on each of the removed middle thirds, so $F' = 0$ on a set of Lebesgue measure $1$. If it had a density $f$, then $f = F' = 0$ almost everywhere, and $\int f = 0 \ne 1$. You can see it among the presets in the figure in [@ch1-s-distribution].

:::exercise{#ch1-ex-cantor-mass title="Where the Cantor measure lives" uses="ch1-def-distribution-function ch1-lem-monotone"}
Let $F$ be the Devil's staircase and $\mu = \mu_F$. On the first removed middle third $(\tfrac13, \tfrac23)$, $F$ is constant, equal to $\tfrac12$. What is $\mu\bigl((\tfrac13, \tfrac23)\bigr)$? What is $\mu(\{x\})$ for a single point $x$?
:::answer
$\mu\bigl((\tfrac13, \tfrac23)\bigr) = F(\tfrac23 -) - F(\tfrac13) = \tfrac12 - \tfrac12 = 0$, using the formula for an open interval. The same holds on every removed interval, so (by countable additivity over the countably many removed intervals) $\mu$ gives the complement of the Cantor set measure $0$: all the mass lives on the Cantor set.

Since $F$ is continuous, $\mu(\{x\}) = F(x) - F(x-) = 0$ for every $x$. So $\mu$ has no atoms, gives full mass to a set of Lebesgue measure zero, and is neither discrete nor given by a density.
:::
:::

The measures $\mu_F$ described in this chapter are sometimes called *Lebesgue–Stieltjes measures*. We will return to them a little later. We now have a very rich class of measures to work with. Part A Integration developed integration against Lebesgue measure, and it is natural to ask whether there is an analogous theory for other measures. The answer is yes, and almost all the work was done in Part A, since its proofs carry over to any measure. Chapter 2 states the key definitions and results.
